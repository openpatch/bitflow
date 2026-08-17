import type { $ZodIssue } from "zod/v4/core";

export const BITFLOW_ERROR_CODES = [
  "INVALID_FLOW",
  "INVALID_ATTEMPT",
  "FLOW_ATTEMPT_MISMATCH",
  "UNKNOWN_BIT_TYPE",
  "LOAD_FAILED",
  "EVALUATION_FAILED",
] as const;

export type BitflowErrorCode = (typeof BITFLOW_ERROR_CODES)[number];

export type Diagnostic = {
  /** Dot/bracket path into the offending document, e.g. `nodes.2.data.title`. */
  path: string;
  message: string;
};

/**
 * The payload of every `bitflow-error` event. A plain object rather than an
 * `Error` subclass so it survives `structuredClone` and `JSON.stringify` on
 * the way to a host that wants to log or display it.
 */
export type BitflowError = {
  code: BitflowErrorCode;
  message: string;
  diagnostics?: Diagnostic[];
};

export const bitflowError = (
  code: BitflowErrorCode,
  message: string,
  diagnostics?: Diagnostic[],
): BitflowError =>
  diagnostics && diagnostics.length > 0
    ? { code, message, diagnostics }
    : { code, message };

/** Turns zod issues into the flat `{ path, message }` shape hosts receive. */
export const toDiagnostics = (issues: readonly $ZodIssue[]): Diagnostic[] =>
  issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: BitflowError };
