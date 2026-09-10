import type {
  ClientMessage,
  Participant,
  RoomState,
  ServerMessage,
  SessionFlow,
} from "./protocol";

/**
 * All the session logic, as a pure function. The Durable Object is the shell;
 * the rules are a function, which is how the rest of this repo is testable.
 *
 * `applyMessage` takes the current state, the participant id of the sender, and
 * a validated client message, and returns the next state plus the outbound
 * frames the server should send. The server owns persistence and the wire; it
 * owns nothing about what a session *means*.
 */

export const emptyRoom = (): RoomState => ({
  flow: null,
  locks: [],
  participants: {},
});

/**
 * An outbound frame and where it goes. `broadcast` reaches every connection;
 * `send` reaches one, by participant id; `toHosts` reaches every participant
 * whose row says host. The server resolves a participant id to a connection (it
 * stored the mapping on `hello`).
 *
 * `toHosts` exists so the board cannot be broadcast by accident. A participant
 * row carries a name and a stripped report, and a room holds the whole class:
 * broadcasting it would put every learner's marks in every learner's browser,
 * where the page not drawing them is no protection at all.
 */
export type Effect =
  | { kind: "broadcast"; message: ServerMessage }
  | { kind: "send"; to: string; message: ServerMessage }
  | { kind: "toHosts"; message: ServerMessage };

export type ApplyResult = { state: RoomState; effects: Effect[] };

const participantsArray = (state: RoomState): Participant[] =>
  Object.values(state.participants);

/** The board. Only ever handed to hosts — see `Effect`. */
const boardToHosts = (state: RoomState): Effect => ({
  kind: "toHosts",
  message: { type: "participants", participants: participantsArray(state) },
});

/** The flow and the locks: what everyone in the room is entitled to know. */
const sessionMessage = (state: RoomState): ServerMessage => ({
  type: "session",
  flow: state.flow,
  locks: state.locks,
});

const errorTo = (to: string, message: string): Effect => ({
  kind: "send",
  to,
  message: { type: "error", message },
});

const upsertParticipant = (
  state: RoomState,
  id: string,
  role: Participant["role"],
  name: string | undefined,
  connected: boolean,
): Participant => {
  const existing = state.participants[id];
  // A rejoining participant id updates its row rather than adding one, so a
  // reload does not show the same learner twice.
  const row: Participant = existing
    ? { ...existing, role, connected, ...(name !== undefined ? { name } : {}) }
    : {
        id,
        role,
        connected,
        status: "inProgress",
        progress: { visited: 0, total: 0 },
        ...(name !== undefined ? { name } : {}),
      };
  state.participants[id] = row;
  return row;
};

export const applyMessage = (
  prev: RoomState,
  from: string,
  message: ClientMessage,
): ApplyResult => {
  // A copy each call: the reducer is pure and the Durable Object hands it the
  // stored state, which it must not mutate in place before deciding to persist.
  const state: RoomState = {
    flow: prev.flow,
    locks: prev.locks,
    participants: { ...prev.participants },
  };

  switch (message.type) {
    case "hello": {
      // The first host claims the room. There is no auth in a classroom
      // session — a code read off a board is the whole of it — but a role is
      // not a thing to hand out on request either: a second self-declared host
      // can set the flow, which deletes every student's row and the results
      // with them. One claim per room turns that into a refusal.
      //
      // A host whose connection drops keeps the claim: the row survives as
      // disconnected, and reconnecting sends the same participant id.
      if (message.role === "host") {
        const claimed = Object.values(prev.participants).find(
          (participant) => participant.role === "host",
        );
        if (claimed && claimed.id !== message.participantId) {
          return {
            state: prev,
            effects: [errorTo(from, "This session already has a host.")],
          };
        }
      }

      upsertParticipant(state, message.participantId, message.role, message.name, true);
      // `from` is the connection's participant id, which the server set from
      // this same id on receiving `hello`; the two agree.
      return { state, effects: [boardToHosts(state)] };
    }

    case "setFlow": {
      const sender = state.participants[from];
      if (!sender || sender.role !== "host") {
        return { state: prev, effects: [errorTo(from, "Only the host may set the flow.")] };
      }

      const flow: SessionFlow = {
        flowUrl: message.flowUrl,
        flowId: message.flowId,
        flowSchemaVersion: message.flowSchemaVersion,
        title: message.title,
      };
      state.flow = flow;
      // Setting a new flow after students have joined clears their rows: the
      // session is now about a different document, and mixing the two would
      // corrupt the statistics. The host row is kept.
      for (const [id, participant] of Object.entries(state.participants)) {
        if (participant.role === "student") delete state.participants[id];
      }
      // The session frame goes to everyone — including the students whose rows
      // were just cleared, who would otherwise never learn the flow changed.
      // The board follows, to the host alone.
      return {
        state,
        effects: [
          { kind: "broadcast", message: sessionMessage(state) },
          boardToHosts(state),
        ],
      };
    }

    case "setLocks": {
      const sender = state.participants[from];
      if (!sender || sender.role !== "host") {
        return { state: prev, effects: [errorTo(from, "Only the host may lock steps.")] };
      }
      state.locks = message.nodeIds;
      // The server has never seen the document, so it cannot validate the node
      // ids against the flow. The host holds the document and is the authority;
      // there is nothing to check here.
      return { state, effects: [{ kind: "broadcast", message: { type: "locks", nodeIds: state.locks } }] };
    }

    case "progress": {
      const sender = state.participants[from];
      if (!sender || sender.role !== "student") {
        return { state: prev, effects: [errorTo(from, "Only a student may report progress.")] };
      }
      // A frame whose flow id or schema version disagrees with the session's
      // is rejected. This is the check that replaces validating an uploaded
      // document, and it is a better one: it catches a student whose URL served
      // a different or stale file, which would otherwise show up as nonsense on
      // the board.
      if (
        !state.flow ||
        message.report.flowId !== state.flow.flowId ||
        message.report.flowSchemaVersion !== state.flow.flowSchemaVersion
      ) {
        return {
          state: prev,
          effects: [errorTo(from, "Your flow does not match this session.")],
        };
      }

      state.participants[from] = {
        ...sender,
        status: message.status,
        currentNodeId: message.currentNodeId,
        progress: message.progress,
        report: message.report,
      };
      return { state, effects: [boardToHosts(state)] };
    }
  }
};

/**
 * Marks a participant disconnected without removing them, so a student who
 * reloads does not vanish from the board mid-session. The server calls this
 * from `onClose`, resolving the connection's stored participant id.
 */
export const applyClose = (prev: RoomState, participantId: string): ApplyResult => {
  const state: RoomState = {
    flow: prev.flow,
    locks: prev.locks,
    participants: { ...prev.participants },
  };
  const row = state.participants[participantId];
  if (!row) return { state: prev, effects: [] };
  state.participants[participantId] = { ...row, connected: false };
  return { state, effects: [boardToHosts(state)] };
};
