import {
  bitflowError,
  BitResultSchema,
  getBit,
  scoreOf,
  toDiagnostics,
  type AttemptSnapshot,
  type BitflowDocument,
  type Result,
} from "@bitflow/core";
import { z } from "zod";

/**
 * Version of the raw result data format.
 *
 * This is the contract any external system — a gradebook, a cloud service, a
 * spreadsheet export — reads or writes, so it is versioned independently of the
 * `.bitflow` document and of the attempt snapshot.
 */
export const REPORT_SCHEMA_VERSION = 1;

export const NodeReportSchema = z.object({
  nodeId: z.string().min(1),
  bitType: z.string().min(1),
  answer: z.unknown(),
  result: BitResultSchema.optional(),
  tries: z.number().int().nonnegative(),
  elapsedMs: z.number().nonnegative().optional(),
});
export type NodeReport = z.infer<typeof NodeReportSchema>;

export const AttemptReportSchema = z.object({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  flowId: z.string().min(1),
  flowSchemaVersion: z.number().int(),
  attemptId: z.string().min(1),
  status: z.enum(["completed", "abandoned"]),
  /**
   * Who this report belongs to. Optional and opaque: bitflow never invents an
   * identity, but a group report has to be able to tell one learner from
   * another, so a host that has identities can attach them here.
   */
  subject: z
    .object({
      id: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
  nodeReports: z.array(NodeReportSchema),
  score: z
    .object({ earned: z.number(), possible: z.number().nonnegative() })
    .optional(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});
export type AttemptReport = z.infer<typeof AttemptReportSchema>;

/**
 * Turns a finished run into the raw result data everything else is built from.
 *
 * Only the nodes the learner actually reached appear, in the order they were
 * visited — a report is a record of what happened, not of what the flow could
 * have asked.
 */
export const createReport = (
  doc: BitflowDocument,
  attempt: AttemptSnapshot,
  subject?: AttemptReport["subject"],
): AttemptReport => {
  const seen = new Set<string>();
  const nodeReports: NodeReport[] = [];

  for (const nodeId of attempt.history) {
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);

    const node = doc.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    // Only bits that can be answered belong in a result report; a title screen
    // would add a row that means nothing to a teacher reading it.
    if (getBit(node.type)?.kind !== "task") continue;

    nodeReports.push({
      nodeId,
      bitType: node.type,
      answer: attempt.answers[nodeId],
      result: attempt.results[nodeId],
      tries: attempt.tries[nodeId] ?? 0,
      elapsedMs: attempt.elapsedMs[nodeId],
    });
  }

  let earned = 0;
  let possible = 0;
  for (const nodeReport of nodeReports) {
    if (!nodeReport.result) continue;
    const score = scoreOf(nodeReport.result);
    earned += score.earned;
    possible += score.possible;
  }

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    flowId: attempt.flowId,
    flowSchemaVersion: attempt.flowSchemaVersion,
    attemptId: attempt.attemptId,
    status: attempt.status === "completed" ? "completed" : "abandoned",
    ...(subject ? { subject } : {}),
    nodeReports,
    score: { earned, possible },
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt ?? attempt.updatedAt,
  };
};

/** Validates raw result data arriving from a host, a file or a service. */
export const parseReport = (input: unknown): Result<AttemptReport> => {
  const value = typeof input === "string" ? safeJson(input) : input;
  if (value === undefined) {
    return {
      ok: false,
      error: bitflowError("INVALID_ATTEMPT", "The report is not valid JSON."),
    };
  }

  const parsed = AttemptReportSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: bitflowError(
        "INVALID_ATTEMPT",
        "The report does not match the report schema.",
        toDiagnostics(parsed.error.issues),
      ),
    };
  }
  return { ok: true, value: parsed.data };
};

export const parseReports = (input: unknown): Result<AttemptReport[]> => {
  const value = typeof input === "string" ? safeJson(input) : input;
  if (!Array.isArray(value)) {
    return {
      ok: false,
      error: bitflowError(
        "INVALID_ATTEMPT",
        "A group report needs an array of reports.",
      ),
    };
  }

  const reports: AttemptReport[] = [];
  for (const [index, entry] of value.entries()) {
    const parsed = parseReport(entry);
    if (!parsed.ok) {
      return {
        ok: false,
        error: {
          ...parsed.error,
          message: `Report ${index + 1}: ${parsed.error.message}`,
        },
      };
    }
    reports.push(parsed.value);
  }
  return { ok: true, value: reports };
};

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
