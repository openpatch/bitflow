import { describe, expect, it } from "vitest";
import type { AttemptReport } from "@bitflow/report";
import {
  parseClientMessage,
  ShareableNodeReportSchema,
  type ClientMessage,
  type RoomState,
  type ShareableReport,
} from "./protocol";
import { applyClose, applyMessage, type Effect } from "./room";

// --- drift guard -----------------------------------------------------------

// The protocol report mirrors `AttemptReport` without `answer`. If the report
// package gains a required field the protocol does not mirror, the constraint
// below stops compiling — which is the point. The direction is this way
// because the protocol omits `answer`, so the protocol type is a *supertype*;
// the report (with answer) must remain assignable to it. Type-only, so
// nothing reaches the bundle.
type AssertAssignable<T, U extends T> = U;
type _ReportDrift = AssertAssignable<ShareableReport, AttemptReport>;
// Referencing it keeps `noUnusedLocals` happy; the constraint above is what
// actually fails to compile when the two types drift apart.
void (null as unknown as _ReportDrift);

// --- fixtures --------------------------------------------------------------

const hostId = "host-1";
const aStudent = "stu-1";

const helloHost = (id = hostId): ClientMessage => ({
  type: "hello",
  role: "host",
  participantId: id,
});

const helloStudent = (id: string, name = id): ClientMessage => ({
  type: "hello",
  role: "student",
  participantId: id,
  name,
});

const setFlow = (flowId = "adaptive"): ClientMessage => ({
  type: "setFlow",
  flowUrl: "/adaptive.bitflow",
  flowId,
  flowSchemaVersion: 1,
  title: "Reading",
});

const setLocks = (nodeIds: string[]): ClientMessage => ({
  type: "setLocks",
  nodeIds,
});

const report = (flowId = "adaptive"): ShareableReport => ({
  schemaVersion: 1,
  flowId,
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  // createReport maps an in-progress attempt to "abandoned"; the frame carries
  // the real AttemptStatus separately, on the participant row.
  status: "abandoned",
  nodeReports: [],
  score: { earned: 0, possible: 0 },
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:00:00.000Z",
});

const progress = (flowId = "adaptive"): ClientMessage => ({
  type: "progress",
  status: "inProgress",
  currentNodeId: "q1",
  progress: { visited: 2, total: 5 },
  report: report(flowId),
});

const apply = (state: RoomState, from: string, message: ClientMessage) =>
  applyMessage(state, from, message);

const findBroadcast = (effects: Effect[]) =>
  effects.find((e) => e.kind === "broadcast")?.message;
const findError = (effects: Effect[]) =>
  effects.find((e) => e.kind === "send")?.message;
const findBoard = (effects: Effect[]) =>
  effects.find((e) => e.kind === "toHosts")?.message;

const sessionWith = (overrides: Partial<RoomState> = {}): RoomState => ({
  flow: null,
  locks: [],
  participants: {},
  ...overrides,
});

describe("roles and authority", () => {
  it("lets the host set the flow", () => {
    const after = applyMessage(sessionWith(), hostId, helloHost());
    const result = apply(after.state, hostId, setFlow());
    expect(result.state.flow?.flowId).toBe("adaptive");
    expect(findBroadcast(result.effects)?.type).toBe("session");
  });

  it("rejects a student setting the flow", () => {
    let state = applyMessage(sessionWith(), aStudent, helloStudent(aStudent)).state;
    const result = apply(state, aStudent, setFlow());
    expect(result.state.flow).toBeNull();
    expect(findError(result.effects)?.type).toBe("error");
  });

  it("lets the host lock steps", () => {
    let state = applyMessage(sessionWith(), hostId, helloHost()).state;
    const result = apply(state, hostId, setLocks(["q1", "q2"]));
    expect(result.state.locks).toEqual(["q1", "q2"]);
    expect(findBroadcast(result.effects)).toMatchObject({ type: "locks", nodeIds: ["q1", "q2"] });
  });

  it("rejects a student locking steps", () => {
    let state = applyMessage(sessionWith(), aStudent, helloStudent(aStudent)).state;
    const result = apply(state, aStudent, setLocks(["q1"]));
    expect(result.state.locks).toEqual([]);
    expect(findError(result.effects)?.type).toBe("error");
  });
});

describe("a student rejoining", () => {
  it("updates its row rather than adding a second one", () => {
    let state = applyMessage(sessionWith(), aStudent, helloStudent(aStudent, "Ada")).state;
    expect(Object.keys(state.participants)).toHaveLength(1);
    expect(state.participants[aStudent].name).toBe("Ada");

    state = applyMessage(state, aStudent, helloStudent(aStudent, "Grace")).state;
    expect(Object.keys(state.participants)).toHaveLength(1);
    expect(state.participants[aStudent].name).toBe("Grace");
  });
});

describe("changing the flow mid-session", () => {
  it("clears the students' rows when the host sets a new flow", () => {
    let state = applyMessage(sessionWith(), hostId, helloHost()).state;
    state = applyMessage(state, aStudent, helloStudent(aStudent)).state;
    expect(state.participants[aStudent]).toBeDefined();

    state = apply(state, hostId, setFlow()).state;
    expect(state.participants[aStudent]).toBeUndefined();
    // The host row stays.
    expect(state.participants[hostId]).toBeDefined();
  });
});

describe("a progress frame", () => {
  const sessionWithHostAndFlow = (): RoomState => {
    let state = applyMessage(sessionWith(), hostId, helloHost()).state;
    state = apply(state, hostId, setFlow()).state;
    state = applyMessage(state, aStudent, helloStudent(aStudent)).state;
    return state;
  };

  it("updates the student's row", () => {
    const state = sessionWithHostAndFlow();
    const result = apply(state, aStudent, progress());
    const row = result.state.participants[aStudent];
    expect(row.status).toBe("inProgress");
    expect(row.currentNodeId).toBe("q1");
    expect(row.progress).toEqual({ visited: 2, total: 5 });
    expect(findBoard(result.effects)?.type).toBe("participants");
  });

  it("is rejected when the flow id disagrees", () => {
    const state = sessionWithHostAndFlow();
    const result = apply(state, aStudent, progress("a-different-flow"));
    expect(findError(result.effects)?.type).toBe("error");
    expect(result.state.participants[aStudent].currentNodeId).toBeUndefined();
  });

  it("is rejected when the schema version disagrees", () => {
    const state = sessionWithHostAndFlow();
    const frame: ClientMessage = {
      type: "progress",
      status: "inProgress",
      currentNodeId: "q1",
      progress: { visited: 2, total: 5 },
      report: { ...report(), flowSchemaVersion: 99 },
    };
    const result = apply(state, aStudent, frame);
    expect(findError(result.effects)?.type).toBe("error");
  });

  it("is rejected when no flow has been set", () => {
    let state = applyMessage(sessionWith(), aStudent, helloStudent(aStudent)).state;
    const result = apply(state, aStudent, progress());
    expect(findError(result.effects)?.type).toBe("error");
  });
});

describe("the answer never reaches the server", () => {
  it("rejects a node report carrying an answer key", () => {
    const withAnswer = {
      nodeId: "q1",
      bitType: "task-choice",
      answer: "the learner wrote this",
      tries: 1,
    };
    expect(ShareableNodeReportSchema.safeParse(withAnswer).success).toBe(false);
  });

  it("accepts a node report without an answer", () => {
    const withoutAnswer = {
      nodeId: "q1",
      bitType: "task-choice",
      result: { state: "correct" },
      tries: 1,
      elapsedMs: 1200,
    };
    expect(ShareableNodeReportSchema.safeParse(withoutAnswer).success).toBe(true);
  });

  it("parses a progress frame whose report carries no answer", () => {
    const frame = parseClientMessage(progress());
    expect(frame).not.toBeNull();
    expect(frame?.type).toBe("progress");
  });
});

describe("the board reaches the teacher only", () => {
  const withHostAndStudent = (): RoomState => {
    let state = applyMessage(sessionWith(), hostId, helloHost()).state;
    state = apply(state, hostId, setFlow()).state;
    return applyMessage(state, aStudent, helloStudent(aStudent, "Ada")).state;
  };

  /** Every frame anyone but a host could receive. */
  const frontOfRoom = (effects: Effect[]) =>
    effects.filter((effect) => effect.kind !== "toHosts").map((e) => e.message);

  it("carries participant rows to hosts and nowhere else", () => {
    const state = withHostAndStudent();
    const result = apply(state, aStudent, progress());

    expect(findBoard(result.effects)).toMatchObject({ type: "participants" });
    // Nothing a student's socket can receive mentions anybody's row: a name and
    // a report in a broadcast is every learner's marks in every browser.
    expect(JSON.stringify(frontOfRoom(result.effects))).not.toContain("Ada");
    expect(frontOfRoom(result.effects)).not.toContainEqual(
      expect.objectContaining({ type: "participants" }),
    );
  });

  it("keeps rows off the session frame everyone gets", () => {
    let state = applyMessage(sessionWith(), hostId, helloHost()).state;
    state = applyMessage(state, aStudent, helloStudent(aStudent, "Ada")).state;
    const result = apply(state, hostId, setFlow("another"));

    const session = findBroadcast(result.effects);
    expect(session).toMatchObject({ type: "session" });
    expect(session).not.toHaveProperty("participants");
    // The students were cleared by the new flow, and still have to be told the
    // session changed — which is why this one frame stays a broadcast.
    expect(session).toMatchObject({ flow: { flowId: "another" } });
  });
});

describe("claiming the room", () => {
  it("refuses a second host", () => {
    const state = applyMessage(sessionWith(), hostId, helloHost()).state;
    const result = applyMessage(state, "impostor", helloHost("impostor"));

    expect(result.state.participants.impostor).toBeUndefined();
    expect(findError(result.effects)).toMatchObject({ type: "error" });
  });

  it("lets the host reconnect under the same id", () => {
    const state = applyClose(
      applyMessage(sessionWith(), hostId, helloHost()).state,
      hostId,
    ).state;
    expect(state.participants[hostId].connected).toBe(false);

    const result = applyMessage(state, hostId, helloHost());
    expect(result.state.participants[hostId].connected).toBe(true);
  });

  it("does not let a student promote itself and wipe the board", () => {
    let state = applyMessage(sessionWith(), hostId, helloHost()).state;
    state = apply(state, hostId, setFlow()).state;
    state = applyMessage(state, aStudent, helloStudent(aStudent)).state;

    state = applyMessage(state, aStudent, helloHost(aStudent)).state;
    expect(state.participants[aStudent].role).toBe("student");

    // And so the flow it could have set, which is what clears the class.
    const result = apply(state, aStudent, setFlow("something-else"));
    expect(result.state.flow?.flowId).toBe("adaptive");
    expect(result.state.participants[aStudent]).toBeDefined();
  });
});

describe("a connection closing", () => {
  it("marks the row disconnected rather than deleting it", () => {
    let state = applyMessage(sessionWith(), aStudent, helloStudent(aStudent)).state;
    expect(state.participants[aStudent].connected).toBe(true);

    const result = applyClose(state, aStudent);
    expect(result.state.participants[aStudent].connected).toBe(false);
    expect(result.state.participants[aStudent]).toBeDefined();
    expect(findBoard(result.effects)?.type).toBe("participants");
  });

  it("does nothing for an unknown participant", () => {
    const state = applyMessage(sessionWith(), aStudent, helloStudent(aStudent)).state;
    const result = applyClose(state, "nobody");
    expect(result.effects).toHaveLength(0);
  });
});
