import {
  routePartykitRequest,
  Server,
  type Connection,
  type WSMessage,
} from "partyserver";
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
 * own `participant:<id>` key. A Durable Object caps a stored value at 128 KiB,
 * and one combined record would approach it as a class grows; a single
 * stripped report stays a few KB. They are loaded in `onStart`, which
 * PartyServer awaits before the first `onConnect` or `onMessage`.
 */
const FLOW_KEY = "flow";
const LOCKS_KEY = "locks";
const PARTICIPANT_PREFIX = "participant:";

/**
 * How long a room outlives its last frame, after which it deletes itself.
 *
 * Measured from the last message, not from when the room was made: a double
 * lesson is still a session, and an expiry counted from the start would wipe
 * one halfway through. Two quiet hours means everybody has gone home.
 *
 * What is being deleted is the point. A room holds a class's worth of stripped
 * reports — names against marks — and nothing else in this platform ever
 * removes them; without this they sit in a Durable Object for as long as the
 * account exists. The storage is trivial. The retention is not.
 */
const ROOM_TTL_MS = 120 * 60 * 1000;

/**
 * What a connection carries once it has said hello. Kept on the socket rather
 * than in a field on the server: `setState` writes it to the WebSocket
 * attachment, so it survives hibernation — a room that sleeps between two
 * questions wakes up still knowing whose socket is whose.
 */
type SessionConnection = Connection<{ participantId: string }>;

export class Session extends Server<Env> {
  // A classroom session is mostly silence — thirty sockets open and nobody
  // typing. Hibernating between frames keeps that from being billed as
  // wall-clock time, and costs nothing here: every piece of state is either in
  // storage (the room) or on the socket (the participant id).
  static options = { hibernate: true };

  state: RoomState = emptyRoom();

  async onStart() {
    const flow = await this.ctx.storage.get<RoomState["flow"]>(FLOW_KEY);
    const locks = await this.ctx.storage.get<string[]>(LOCKS_KEY);
    this.state.flow = flow ?? null;
    this.state.locks = locks ?? [];

    // Participants are stored each under their own key, so load them by list.
    // The prefix is passed to the list rather than filtered afterwards:
    // PartyServer keeps its own bookkeeping in this same namespace, and an
    // unfiltered list would hand us its keys too.
    const entries = await this.ctx.storage.list<Participant>({
      prefix: PARTICIPANT_PREFIX,
    });
    this.state.participants = {};
    for (const participant of entries.values()) {
      // Stored rows come back disconnected: a cold wake of the whole room
      // should not show everyone as still online.
      this.state.participants[participant.id] = { ...participant, connected: false };
    }
  }

  async onConnect(connection: Connection) {
    // The flow and the locks, which is all this frame carries. The board is
    // not on it: whoever has just connected has not said hello, so there is
    // nothing yet to say they are the teacher.
    connection.send(JSON.stringify(this.sessionMessage()));
  }

  async onMessage(sender: SessionConnection, raw: WSMessage) {
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
      sender.setState({ participantId: message.participantId });
    }

    const from = sender.state?.participantId;

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
    await this.pushExpiry();
    this.dispatch(effects);
  }

  async onClose(connection: SessionConnection) {
    const from = connection.state?.participantId;
    if (!from) return;

    // A reload opens the new socket before the old one's close arrives, and the
    // two are different connections with no ordering between them. Marking the
    // row disconnected on the strength of a socket the participant has already
    // replaced puts a live student on the board as gone — and nothing takes it
    // back, because a `progress` frame carries the row's `connected` forward
    // rather than setting it. So a close only counts when no other live
    // connection still claims the id.
    for (const other of this.getConnections<{ participantId: string }>()) {
      if (other.id !== connection.id && other.state?.participantId === from) return;
    }

    const prev = this.state;
    const { state, effects } = applyClose(prev, from);
    await this.persist(prev, state);
    this.state = state;
    // A leaver counts as activity: a class that has just filed out should not
    // have the board deleted two hours from whenever the last answer landed,
    // but two hours from when the room actually went quiet.
    await this.pushExpiry();
    this.dispatch(effects);
  }

  /**
   * The room's own expiry, `ROOM_TTL_MS` after the last frame. Deletes what the
   * room owns — the flow, the locks, every participant row — and leaves
   * PartyServer's own bookkeeping alone, which is why this is a list of keys
   * and not `deleteAll()`.
   *
   * Storage is the authority on what to delete, not `this.state`: an alarm can
   * be the thing that wakes a hibernating room, and a room cleaning itself up
   * should not depend on having been read into memory first.
   */
  async onAlarm() {
    const rows = await this.ctx.storage.list({ prefix: PARTICIPANT_PREFIX });
    await this.ctx.storage.delete([FLOW_KEY, LOCKS_KEY, ...rows.keys()]);
    this.state = emptyRoom();

    // Anyone still holding a socket is told, then dropped. The error frame
    // first, because both pages already render one and a bare close says
    // nothing: a student would otherwise see their next answer refused with
    // "your flow does not match this session", which is true and useless.
    // PartySocket will reconnect and find an empty room, which is what an
    // expired session is.
    const expired = JSON.stringify({
      type: "error",
      message: "This session has expired.",
    } satisfies ServerMessage);
    for (const connection of this.getConnections()) {
      connection.send(expired);
      connection.close(1000, "Session expired");
    }
  }

  onError(connection: Connection, error: unknown) {
    console.error("connection error", connection.id, error);
  }

  // --- helpers -------------------------------------------------------------

  /**
   * Pushes the expiry alarm out to `ROOM_TTL_MS` from now. A Durable Object has
   * one alarm and setting it replaces the old one, so there is no bookkeeping
   * here beyond the write itself — which is why the write is worth skipping:
   * re-arming on every frame would add a storage write per answer, per student.
   * A minute of slop on a two-hour expiry costs nothing and collapses that to
   * one write a minute.
   */
  private async pushExpiry() {
    const now = Date.now();
    const current = await this.ctx.storage.getAlarm();
    if (current !== null && current - now > ROOM_TTL_MS - 60_000) return;
    await this.ctx.storage.setAlarm(now + ROOM_TTL_MS);
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
        this.broadcast(JSON.stringify(effect.message));
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
    const frame = JSON.stringify(message);
    // A participant is a person, not a socket: a reload can leave two open for
    // a moment. Every socket claiming the id gets the frame, so the board does
    // not go dark on whichever one the map would have forgotten.
    for (const connection of this.getConnections<{ participantId: string }>()) {
      if (connection.state?.participantId === participantId) connection.send(frame);
    }
  }

  /**
   * Persists only what changed. The reducer builds a new participant object for
   * the row it touched and leaves the rest by reference, so identity compares
   * the diff without a deep walk — a progress frame writes one key, not a
   * class's worth.
   */
  private async persist(prev: RoomState, state: RoomState) {
    if (prev.flow !== state.flow) await this.ctx.storage.put(FLOW_KEY, state.flow);
    if (prev.locks !== state.locks) await this.ctx.storage.put(LOCKS_KEY, state.locks);

    for (const id of Object.keys(prev.participants)) {
      if (!(id in state.participants)) {
        await this.ctx.storage.delete(PARTICIPANT_PREFIX + id);
      }
    }
    for (const [id, after] of Object.entries(state.participants)) {
      if (prev.participants[id] !== after) {
        await this.ctx.storage.put(PARTICIPANT_PREFIX + id, after);
      }
    }
  }
}

/**
 * The Worker in front of the Durable Object. `routePartykitRequest` maps
 * `/parties/session/<room code>` onto the `Session` binding — `session` being
 * the kebab-case of the binding name in `wrangler.jsonc`, which is why the
 * client passes `party: "session"`. Anything else is a 404: this Worker serves
 * the session socket and nothing besides.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not found", { status: 404 })
    );
  },
};
