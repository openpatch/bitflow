import { createId, type AttemptSnapshot, type AttemptStatus, type BitflowDocument } from "@bitflow/core";
import { createReport, type AttemptReport } from "@bitflow/report";
import { PartySocket } from "partysocket";
import {
  parseServerMessage,
  type ClientMessage,
  type Participant,
  type ServerMessage,
  type SessionFlow,
  type ShareableReport,
} from "bitflow-party/protocol";

/**
 * The shared client for a live session. Both pages use it: the host to set the
 * flow and the locks, the student to report progress. It resolves the party
 * host, wraps `PartySocket`, validates every inbound frame with the protocol
 * schemas, and holds the answer-stripping that keeps what a learner wrote from
 * ever leaving their browser.
 *
 * A student's socket never receives a `participants` frame — the board carries
 * names and marks, and the server sends it to hosts only. `onParticipants` is
 * therefore a host-side callback in practice, whichever page registers it.
 */

export const PARTY_HOST =
  import.meta.env.VITE_PARTY_HOST ?? "localhost:1999";

/**
 * Six characters from an unambiguous alphabet — no `O`/`0` or `I`/`1`, which
 * read differently on a board than they sound in a room. `createId` is prefixed
 * and not suitable for something read aloud.
 */
export const createRoomCode = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

/**
 * Builds a report and drops the `answer` from each node report before it goes
 * anywhere. The receiving schema is `z.strictObject`, so even a frame a
 * modified client assembled by hand cannot carry an `answer` key — but the
 * stripping is here too, so the learner's page never serialises one to begin
 * with.
 */
export const buildShareableReport = (
  doc: BitflowDocument,
  snapshot: AttemptSnapshot,
  subject: { id: string; label?: string },
): ShareableReport => {
  const report: AttemptReport = createReport(doc, snapshot, subject);
  return {
    ...report,
    nodeReports: report.nodeReports.map(({ answer: _answer, ...rest }) => rest),
  };
};

export type SessionCallbacks = {
  /** The flow and the locks. Carries nothing about anybody in the room. */
  onSession?: (flow: SessionFlow | null, locks: string[]) => void;
  /** The board. Only a host is ever sent one. */
  onParticipants?: (participants: Participant[]) => void;
  onLocks?: (nodeIds: string[]) => void;
  onError?: (message: string) => void;
};

export class LiveSession {
  private socket: PartySocket;
  private pendingProgress: ReturnType<typeof setTimeout> | null = null;
  private nextProgress: ClientMessage | null = null;

  constructor(
    role: "host" | "student",
    participantId: string,
    room: string,
    name: string | undefined,
    callbacks: SessionCallbacks,
  ) {
    this.socket = new PartySocket({ host: PARTY_HOST, room });

    this.socket.addEventListener("message", (event) => {
      const message = parseServerMessage(JSON.parse((event as MessageEvent).data));
      if (!message) return;
      this.handle(message, callbacks);
    });

    // Say hello immediately. PartySocket buffers messages until the socket
    // opens, so `hello` is the first thing on the wire — before any `setFlow`
    // or `setLocks` the host calls right after constructing the session, which
    // would otherwise arrive first and be rejected for not having said hello.
    this.send({ type: "hello", role, participantId, ...(name ? { name } : {}) });
  }

  close(): void {
    if (this.pendingProgress) clearTimeout(this.pendingProgress);
    this.socket.close();
  }

  setFlow(flow: SessionFlow): void {
    this.send({ type: "setFlow", ...flow });
  }

  setLocks(nodeIds: string[]): void {
    this.send({ type: "setLocks", nodeIds });
  }

  /**
   * Reports where the student is and how they are doing. Debounced by 250 ms,
   * matching the existing debounce in `src/flow.ts`: a snapshot arrives on every
   * answer, and the wire is not free.
   */
  reportProgress(
    status: AttemptStatus,
    currentNodeId: string | undefined,
    visited: number,
    total: number,
    report: ShareableReport,
  ): void {
    this.nextProgress = {
      type: "progress",
      status,
      currentNodeId,
      progress: { visited, total },
      report,
    };
    if (this.pendingProgress) return;
    this.pendingProgress = setTimeout(() => {
      this.pendingProgress = null;
      if (this.nextProgress) {
        const frame = this.nextProgress;
        this.nextProgress = null;
        this.send(frame);
      }
    }, 250);
  }

  private send(message: ClientMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  private handle(message: ServerMessage, callbacks: SessionCallbacks): void {
    switch (message.type) {
      case "session":
        callbacks.onSession?.(message.flow, message.locks);
        break;
      case "participants":
        callbacks.onParticipants?.(message.participants);
        break;
      case "locks":
        callbacks.onLocks?.(message.nodeIds);
        break;
      case "error":
        callbacks.onError?.(message.message);
        break;
    }
  }
}

/** Mints a participant id and keeps it in localStorage so a reload rejoins. */
export const participantIdFor = (room: string): string => {
  const key = `bitflow-session:${room}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = createId("participant");
  localStorage.setItem(key, id);
  return id;
};
