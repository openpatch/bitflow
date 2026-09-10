import { z } from "zod";

/**
 * The wire contract for a live session.
 *
 * Results go to the teacher, not to the class. A participant row carries a
 * name, a position in the flow and a stripped report, so it is only ever put on
 * the wire towards a host — never broadcast. The frame every connection does
 * receive, `session`, carries the flow and the locks and nothing about anybody.
 *
 * The server stores results, never content: it holds a flow URL, a lock list,
 * and one stripped report per participant. The document — every embedded
 * image, every correct answer, every word of stimulus text — never reaches the
 * server. Students fetch the flow themselves from the URL, the same way
 * `<bitflow-flow src>` already does.
 *
 * This module is the shared thing `platforms/web` imports (via
 * `"exports": { "./protocol": ... }`). It is hand-written on `zod` alone so the
 * server needs no `@bitflow/core`, and — deliberately — no `@bitflow/report`,
 * whose index calls `injectStyles` at module scope and exports React
 * components that have no business in a worker. `@bitflow/report` is a
 * type-only devDependency, used solely by the drift assertion in
 * `room.test.ts`.
 *
 * The node report here mirrors `AttemptReport`'s `NodeReport` with one key
 * removed: `answer`. What makes that trustworthy is the receiving end: the
 * schema uses `z.strictObject`, so a frame carrying an `answer` key is
 * rejected by the schema itself rather than by a check somebody has to
 * remember to write. A modified client cannot push answers to the host even
 * deliberately.
 */

// --- the report, minus the answer ------------------------------------------

// These mirror `@bitflow/core`'s result schemas. Duplicated on purpose: the
// server must not import `@bitflow/core` (it never parses a document), and a
// drift assertion in `room.test.ts` guards the report half.

const BitResultStateSchema = z.enum(["correct", "wrong", "unknown"]);

const FeedbackMessageSchema = z.object({
  message: z.string(),
  severity: z.enum(["error", "warning", "info", "success"]),
});

const BitResultSchema = z.object({
  state: BitResultStateSchema,
  score: z
    .object({ earned: z.number(), possible: z.number().nonnegative() })
    .optional(),
  feedback: z.array(FeedbackMessageSchema).optional(),
  allowRetry: z.boolean().optional(),
  detail: z.record(z.string(), z.unknown()).optional(),
});

/**
 * A node report with the answer stripped. `z.strictObject` rejects any extra
 * key — including `answer` — so the privacy boundary is the schema, not a
 * filter somebody has to remember to apply.
 */
export const ShareableNodeReportSchema = z.strictObject({
  nodeId: z.string().min(1),
  bitType: z.string().min(1),
  result: BitResultSchema.optional(),
  tries: z.number().int().nonnegative(),
  elapsedMs: z.number().nonnegative().optional(),
});
export type ShareableNodeReport = z.infer<typeof ShareableNodeReportSchema>;

export const ShareableReportSchema = z.object({
  schemaVersion: z.literal(1),
  flowId: z.string().min(1),
  flowSchemaVersion: z.number().int(),
  attemptId: z.string().min(1),
  status: z.enum(["completed", "abandoned"]),
  subject: z
    .object({ id: z.string().optional(), label: z.string().optional() })
    .optional(),
  nodeReports: z.array(ShareableNodeReportSchema),
  score: z
    .object({ earned: z.number(), possible: z.number().nonnegative() })
    .optional(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});
export type ShareableReport = z.infer<typeof ShareableReportSchema>;

// --- the session -----------------------------------------------------------

const RoleSchema = z.enum(["host", "student"]);

export const SessionFlowSchema = z.object({
  flowUrl: z.string().min(1),
  flowId: z.string().min(1),
  flowSchemaVersion: z.number().int(),
  title: z.string(),
});
export type SessionFlow = z.infer<typeof SessionFlowSchema>;

const ProgressSchema = z.object({
  visited: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const ParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  role: RoleSchema,
  connected: z.boolean(),
  status: z.enum(["inProgress", "completed", "abandoned"]),
  currentNodeId: z.string().optional(),
  progress: ProgressSchema,
  report: ShareableReportSchema.optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

/**
 * The whole session state the server persists and the reducer mutates. The
 * flow is `null` until the host sets one; the lock list is host-supplied and
 * never validated against a document the server has not seen.
 */
export type RoomState = {
  flow: SessionFlow | null;
  locks: string[];
  participants: Record<string, Participant>;
};

// --- client → server -------------------------------------------------------

export const HelloSchema = z.object({
  type: z.literal("hello"),
  role: RoleSchema,
  participantId: z.string().min(1),
  name: z.string().optional(),
});

export const SetFlowSchema = z.object({
  type: z.literal("setFlow"),
  flowUrl: z.string().min(1),
  flowId: z.string().min(1),
  flowSchemaVersion: z.number().int(),
  title: z.string(),
});

export const SetLocksSchema = z.object({
  type: z.literal("setLocks"),
  nodeIds: z.array(z.string()),
});

export const ProgressFrameSchema = z.object({
  type: z.literal("progress"),
  status: z.enum(["inProgress", "completed", "abandoned"]),
  currentNodeId: z.string().optional(),
  progress: ProgressSchema,
  report: ShareableReportSchema,
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  HelloSchema,
  SetFlowSchema,
  SetLocksSchema,
  ProgressFrameSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// --- server → client -------------------------------------------------------

/**
 * The room as it stands, for anyone connected: which flow, and which steps are
 * held shut. Deliberately carries no participant rows.
 *
 * A student needs the flow and the locks and nothing else, and this frame is
 * the one thing every connection receives — so anything on it reaches the whole
 * class. The rows, which carry names and results, travel only in
 * `participants`, and that one goes to hosts.
 */
export const SessionMessageSchema = z.object({
  type: z.literal("session"),
  flow: SessionFlowSchema.nullable(),
  locks: z.array(z.string()),
});

export const ParticipantsMessageSchema = z.object({
  type: z.literal("participants"),
  participants: z.array(ParticipantSchema),
});

export const LocksMessageSchema = z.object({
  type: z.literal("locks"),
  nodeIds: z.array(z.string()),
});

export const ErrorMessageSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  SessionMessageSchema,
  ParticipantsMessageSchema,
  LocksMessageSchema,
  ErrorMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/** Parses an inbound client frame; returns `null` when it is not valid. */
export const parseClientMessage = (raw: unknown): ClientMessage | null => {
  const parsed = ClientMessageSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

/** Parses an inbound server frame; returns `null` when it is not valid. */
export const parseServerMessage = (raw: unknown): ServerMessage | null => {
  const parsed = ServerMessageSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};
