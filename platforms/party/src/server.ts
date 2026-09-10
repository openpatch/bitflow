import type * as Party from "partykit/server";
import {
  parseClientMessage,
  type Participant,
  type RoomState,
  type ServerMessage,
} from "./protocol";
import { applyClose, applyMessage, emptyRoom, type Effect } from "./room";

/**
 * The Durable Object shell. The rules live in `room.ts`; this only owns the
 * wire and persistence.
 *
 * State is persisted under `flow` and `locks`, and each participant under its
 * own `participant:<id>` key. PartyKit caps a stored value at 128 KiB, and one
 * combined record would approach it as a class grows; a single stripped report
 * stays a few KB. They are loaded in `onStart`, before the first `onConnect`.
 */
const FLOW_KEY = "flow";
const LOCKS_KEY = "locks";
const PARTICIPANT_PREFIX = "participant:";

export default class Server implements Party.Server {
  state: RoomState = emptyRoom();
  // participant id → connection id, so a `send` effect can find the right
  // socket. Filled on `hello`.
  connections: Record<string, string> = {};

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const flow = await this.room.storage.get<RoomState["flow"]>(FLOW_KEY);
    const locks = await this.room.storage.get<string[]>(LOCKS_KEY);
    this.state.flow = flow ?? null;
    this.state.locks = locks ?? [];

    // Participants are stored each under their own key, so load them by list.
    const entries = await this.room.storage.list<Participant>();
    this.state.participants = {};
    for (const [key, participant] of entries) {
      if (key.startsWith(PARTICIPANT_PREFIX)) {
        // Stored rows come back disconnected: a cold wake of the whole room
        // should not show everyone as still online.
        this.state.participants[participant.id] = { ...participant, connected: false };
      }
    }
  }

  async onConnect(connection: Party.Connection) {
    // The flow and the locks, which is all this frame carries. The board is
    // not on it: whoever has just connected has not said hello, so there is
    // nothing yet to say they are the teacher.
    connection.send(JSON.stringify(this.sessionMessage()));
  }

  async onMessage(raw: string | ArrayBuffer, sender: Party.Connection) {
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    const message = parseClientMessage(JSON.parse(text));
    if (!message) {
      sender.send(JSON.stringify({ type: "error", message: "Unrecognised message." }));
      return;
    }

    // `hello` is what ties a participant id to this connection, which every
    // later message needs. The participant id the client claims is trusted:
    // there is no auth in a classroom session, by design. The *role* is not —
    // `applyMessage` refuses a second host, because that one claims authority
    // over everybody else's results.
    if (message.type === "hello") {
      this.connections[message.participantId] = sender.id;
    }

    const from =
      message.type === "hello" ? message.participantId : this.participantIdOf(sender);

    if (!from) {
      sender.send(
        JSON.stringify({ type: "error", message: "Say hello before sending anything else." }),
      );
      return;
    }

    const prev = this.state;
    const { state, effects } = applyMessage(prev, from, message);
    await this.persist(prev, state);
    this.state = state;
    this.dispatch(effects);
  }

  async onClose(connection: Party.Connection) {
    const from = this.participantIdOf(connection);
    if (!from) return;
    delete this.connections[from];
    const prev = this.state;
    const { state, effects } = applyClose(prev, from);
    await this.persist(prev, state);
    this.state = state;
    this.dispatch(effects);
  }

  async onError(connection: Party.Connection, error: Error) {
    console.error("connection error", connection.id, error);
  }

  // --- helpers -------------------------------------------------------------

  private participantIdOf(connection: Party.Connection): string | undefined {
    for (const [participantId, connectionId] of Object.entries(this.connections)) {
      if (connectionId === connection.id) return participantId;
    }
    return undefined;
  }

  private sessionMessage(): ServerMessage {
    return {
      type: "session",
      flow: this.state.flow,
      locks: this.state.locks,
    };
  }

  private dispatch(effects: Effect[]) {
    for (const effect of effects) {
      if (effect.kind === "broadcast") {
        this.room.broadcast(JSON.stringify(effect.message));
        continue;
      }
      if (effect.kind === "toHosts") {
        // Resolved from the rows rather than from a list the reducer built, so
        // a frame aimed at hosts cannot reach anybody else even if the reducer
        // is wrong about who is who.
        for (const participant of Object.values(this.state.participants)) {
          if (participant.role === "host") this.sendTo(participant.id, effect.message);
        }
        continue;
      }
      this.sendTo(effect.to, effect.message);
    }
  }

  private sendTo(participantId: string, message: ServerMessage) {
    const connectionId = this.connections[participantId];
    if (!connectionId) return;
    this.room.getConnection(connectionId)?.send(JSON.stringify(message));
  }

  /**
   * Persists only what changed. The reducer builds a new participant object for
   * the row it touched and leaves the rest by reference, so identity compares
   * the diff without a deep walk — a progress frame writes one key, not a
   * class's worth.
   */
  private async persist(prev: RoomState, state: RoomState) {
    if (prev.flow !== state.flow) await this.room.storage.put(FLOW_KEY, state.flow);
    if (prev.locks !== state.locks) await this.room.storage.put(LOCKS_KEY, state.locks);

    for (const id of Object.keys(prev.participants)) {
      if (!(id in state.participants)) {
        await this.room.storage.delete(PARTICIPANT_PREFIX + id);
      }
    }
    for (const [id, after] of Object.entries(state.participants)) {
      if (prev.participants[id] !== after) {
        await this.room.storage.put(PARTICIPANT_PREFIX + id, after);
      }
    }
  }
}
