import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
import { finishedAt, nameIn, type Data } from "./schema";
import type { AttemptSnapshot, BitflowDocument } from "@bitflow/core";

const data: Data = {
  title: "Certificate of completion",
  markdown: "For finishing the **whole** assessment.",
  issuer: "Room 12",
  showName: true,
  showScore: true,
  showDate: true,
  printLabel: "",
};

/** A flow that asks who the learner is, then one question. */
const flow = {
  version: 1,
  meta: {
    id: "flow-1",
    title: "",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
    pools: [],
    sections: [],
    navigation: "back",
    allowSkip: true,
  },
  nodes: [
    {
      id: "who",
      type: "start-identify",
      position: { x: 0, y: 0 },
      data: {
        fields: [
          { id: "name", label: "First name", required: true, kind: "text", options: [] },
          { id: "class", label: "Class", required: false, kind: "text", options: [] },
        ],
      },
    },
    { id: "q1", type: "test-task", position: { x: 0, y: 100 }, data: {} },
  ],
  edges: [],
} as unknown as BitflowDocument;

const attempt = {
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  status: "completed",
  currentNodeId: "end",
  history: ["who", "q1", "end"],
  answers: { who: { name: "Robin", class: "7b" } },
  results: { q1: { state: "correct" } },
  tries: { q1: 1 },
  elapsedMs: {},
  pools: {},
  startedAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-03-04T10:05:00.000Z",
  enteredAt: "2026-03-04T10:05:00.000Z",
  completedAt: "2026-03-04T10:05:00.000Z",
} as unknown as AttemptSnapshot;

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement(
    "bitflow-end-certificate",
  ) as HTMLElement & Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<bitflow-end-certificate>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-end-certificate")).toBeDefined();
  });

  it("fills itself in from the run", async () => {
    const element = await mount({ attempt, flow });
    expect(element.textContent).toContain("Certificate of completion");
    expect(element.querySelector("strong")?.textContent).toBe("whole");
    expect(element.textContent).toContain("Robin");
    expect(element.textContent).toContain("1 of 1 points");
    expect(element.textContent).toContain("Room 12");
    expect(element.textContent).toContain("March 4, 2026");
  });

  it("leaves out whatever the author switched off", async () => {
    const element = await mount({
      data: { ...data, showName: false, showScore: false, showDate: false },
      attempt,
      flow,
    });
    expect(element.textContent).not.toContain("Robin");
    expect(element.textContent).not.toContain("points");
    expect(element.textContent).not.toContain("2026");
    // The issuer is not a fact about the learner and stays.
    expect(element.textContent).toContain("Room 12");
  });

  it("says it is not filled in yet when there is nothing to fill it with", async () => {
    const element = await mount({ data: { ...data, issuer: "" } });
    expect(element.textContent).toContain("fills in once");
  });

  it("prints on request", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    const element = await mount({ attempt, flow });

    element.querySelector("button")!.click();
    expect(print).toHaveBeenCalledOnce();
  });
});

describe("nameIn", () => {
  it("takes the first answered question of the step that asked", () => {
    expect(nameIn(flow, attempt)).toBe("Robin");
  });

  it("falls through to the next when the first was left blank", () => {
    expect(
      nameIn(flow, {
        ...attempt,
        answers: { who: { name: "  ", class: "7b" } },
      }),
    ).toBe("7b");
  });

  it("has nothing to give when the assessment never asked", () => {
    expect(nameIn({ ...flow, nodes: [flow.nodes[1]] }, attempt)).toBeUndefined();
  });

  it("has nothing to give without a run to read", () => {
    expect(nameIn(flow, undefined)).toBeUndefined();
    expect(nameIn(undefined, attempt)).toBeUndefined();
  });

  it("survives a step whose data is not what this version expects", () => {
    // `parseFlow` deliberately does not check bit data, so this arrives here
    // exactly as written — including written by hand, or by an older bit.
    const odd = {
      ...flow,
      nodes: [{ ...flow.nodes[0], data: { fields: "not a list" } }],
    } as unknown as BitflowDocument;
    expect(nameIn(odd, attempt)).toBeUndefined();
  });
});

describe("finishedAt", () => {
  it("uses when the run finished", () => {
    expect(finishedAt(attempt)?.toISOString()).toBe("2026-03-04T10:05:00.000Z");
  });

  it("falls back to the last change for a run still going", () => {
    const { completedAt: _dropped, ...going } = attempt;
    expect(finishedAt(going as AttemptSnapshot)?.toISOString()).toBe(
      "2026-03-04T10:05:00.000Z",
    );
  });

  it("has no date without a run, or with a broken one", () => {
    expect(finishedAt(undefined)).toBeUndefined();
    expect(
      finishedAt({ ...attempt, completedAt: "not a date" } as AttemptSnapshot),
    ).toBeUndefined();
  });
});
