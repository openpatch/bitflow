import { z } from "zod";

/**
 * Version of the `.bitflow` document format. Bumped only for changes a reader
 * of an older document cannot absorb; additive optional fields do not bump it.
 */
export const FLOW_SCHEMA_VERSION = 1;

export const LOCALES = [
  "en",
  "de",
  "fr",
  "nl",
  "es",
  "it",
  "pt",
  "tr",
] as const;

export const LocaleSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof LocaleSchema>;

// --- conditions -------------------------------------------------------------
//
// Conditions live on edges. The old model expressed branching with dedicated
// `split-answer` / `split-result` / `split-points` nodes; an edge-level
// condition says the same thing with one concept instead of four.

/**
 * How a task turned out. Declared here rather than with the rest of the result
 * types because conditions count outcomes, and the vocabulary has to exist
 * before they can name one.
 */
export const BIT_RESULT_STATES = [
  "correct",
  "wrong",
  /**
   * Not scorable: skipped, or a task whose evaluation is switched off. There is
   * deliberately no "awaiting a teacher" state — bitflow grades in the browser
   * and has no server, so nothing here could ever resolve one.
   */
  "unknown",
] as const;
export const BitResultStateSchema = z.enum(BIT_RESULT_STATES);
export type BitResultState = z.infer<typeof BitResultStateSchema>;

/**
 * Which tasks a count or a score is taken over.
 *
 * Absent means the whole attempt, which is what a whole-assessment threshold
 * wants. A scope is what makes adaptive routing expressible: "did they pass
 * *this section*", "of the *last three*, how many were right".
 */
export const ScopeSchema = z.union([
  /** Everything in one section — see `BitflowMeta.sections`. */
  z.object({ kind: z.literal("section"), id: z.string().min(1) }),
  /** A hand-picked set of steps. */
  z.object({ kind: z.literal("nodes"), nodeIds: z.array(z.string().min(1)) }),
  /**
   * The most recently answered steps, newest first, counted off the attempt's
   * own history. A step answered twice counts once — it is the same task.
   */
  z.object({ kind: z.literal("last"), count: z.number().int().positive() }),
]);
export type Scope = z.infer<typeof ScopeSchema>;

/** A value pulled out of the running attempt for a condition to compare. */
export const ValueRefSchema = z.union([
  z.object({
    kind: z.literal("answer"),
    nodeId: z.string().min(1),
    /** Dot path into the answer object, e.g. `"checked.0"`. */
    path: z.string().optional(),
  }),
  z.object({
    kind: z.literal("result"),
    nodeId: z.string().min(1),
    /** Dot path into the result, e.g. `"state"`. */
    path: z.string().optional(),
  }),
  z.object({
    kind: z.literal("tries"),
    nodeId: z.string().min(1),
  }),
  /**
   * How many times the learner has been *shown* a step, read off the history.
   *
   * Distinct from `tries`, which counts gradings: a content step is never
   * graded, so a loop that goes round an explanation has nothing else to count.
   * This is what gives a loop a way out — "after the third time, move on".
   */
  z.object({
    kind: z.literal("visits"),
    nodeId: z.string().min(1),
  }),
  /**
   * How sure the learner said they were, `0`–`1`, when `meta.askConfidence` is
   * on. Undefined for a step they were never asked about, which makes any
   * comparison false rather than accidentally true.
   *
   * Confident and wrong is a different learner from unsure and wrong, and it is
   * the branch worth drawing: one has a misconception, the other has a gap.
   */
  z.object({
    kind: z.literal("confidence"),
    nodeId: z.string().min(1),
  }),
  /**
   * Seconds spent on one step, or on the whole attempt when `nodeId` is
   * omitted. Time *spent*, on the same basis as the limits: the clock pauses
   * when the learner is not there.
   */
  z.object({
    kind: z.literal("timeSpent"),
    nodeId: z.string().min(1).optional(),
  }),
  /**
   * Seconds left on `meta.timeLimit`. Undefined when the flow has no limit, so
   * "less than a minute left" is simply false rather than true for everyone.
   */
  z.object({ kind: z.literal("timeRemaining") }),
  /** Points earned so far, over the whole attempt or one scope. */
  z.object({ kind: z.literal("score"), scope: ScopeSchema.optional() }),
  /** Earned/possible so far, in `[0, 1]`. `0` when nothing is scorable yet. */
  z.object({ kind: z.literal("scoreRatio"), scope: ScopeSchema.optional() }),
  /**
   * How many tasks so far ended in a given outcome — "at least three correct"
   * being the branch a teacher reaches for most often.
   *
   * Counts tasks, not points: a partly-credited answer counts once, and only
   * if it reached the state being counted. That is what "how many did they get
   * right" means to the person writing the branch, whereas `score` is the
   * measure to use when partial credit should carry weight.
   */
  z.object({
    kind: z.literal("resultCount"),
    state: BitResultStateSchema.default("correct"),
    scope: ScopeSchema.optional(),
  }),
]);
export type ValueRef = z.infer<typeof ValueRefSchema>;

export const COMPARE_OPS = [
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "notIn",
  "isTrue",
] as const;
export const CompareOpSchema = z.enum(COMPARE_OPS);
export type CompareOp = z.infer<typeof CompareOpSchema>;

const ComparableSchema = z.union([z.string(), z.number(), z.boolean()]);
export type Comparable = z.infer<typeof ComparableSchema>;

export type Condition =
  | { type: "always" }
  | {
      type: "compare";
      left: ValueRef;
      op: CompareOp;
      right?: Comparable | Comparable[];
    }
  | { type: "and"; conditions: Condition[] }
  | { type: "or"; conditions: Condition[] }
  | { type: "not"; condition: Condition };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal("always") }),
    z.object({
      type: z.literal("compare"),
      left: ValueRefSchema,
      op: CompareOpSchema,
      right: z
        .union([ComparableSchema, z.array(ComparableSchema)])
        .optional(),
    }),
    z.object({
      type: z.literal("and"),
      conditions: z.array(ConditionSchema),
    }),
    z.object({
      type: z.literal("or"),
      conditions: z.array(ConditionSchema),
    }),
    z.object({ type: z.literal("not"), condition: ConditionSchema }),
  ]),
);

// --- document ---------------------------------------------------------------

export const PositionSchema = z.object({ x: z.number(), y: z.number() });
export type Position = z.infer<typeof PositionSchema>;

/**
 * A node in the flow. `type` names a bit ("task-choice", "title-simple", …)
 * and `data` is owned by that bit's own schema — the envelope deliberately
 * does not look inside it, so a document round-trips through a host that has
 * not loaded every bit package.
 */
export const BitNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: PositionSchema,
  data: z.record(z.string(), z.unknown()).default({}),
  /**
   * The pool this step belongs to, if any — see `BitflowMeta.pools`.
   *
   * Membership lives on the node rather than the pool holding a list of ids,
   * so deleting a step cannot leave a pool pointing at something that is gone.
   */
  pool: z.string().min(1).optional(),
  /**
   * The section this step belongs to, if any — see `BitflowMeta.sections`.
   *
   * Orthogonal to `pool`: a pool decides *which* steps a learner gets and in
   * what order, a section says what a run of steps have in common — the
   * passage they are all about, the name the progress line shows, and the
   * scope a condition can count over.
   */
  section: z.string().min(1).optional(),
});
export type BitNode = z.infer<typeof BitNodeSchema>;

export const BitEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  /** Shown on the canvas; useful to label the two sides of a branch. */
  label: z.string().optional(),
  /** Absent means "always follow". */
  condition: ConditionSchema.optional(),
  /**
   * What arriving over this edge clears on the step it lands on.
   *
   * This is what makes a remediation loop work. Without it, an edge that goes
   * back to a question the learner got wrong lands on a step that already has
   * a result, so the runtime shows the old answer marked wrong with no way to
   * change it — the loop is drawable but does nothing.
   *
   * `"result"` clears the grading and keeps what they wrote, the same bargain
   * Try again makes. `"answer"` clears both, which is what a task that
   * *measures* something (a timed run, a typing speed) needs: its recorded
   * figure has to be taken again, not edited.
   *
   * Absent means the step is left exactly as it was, which is right for an
   * edge that goes back so the learner can *read* an answer again.
   */
  resetTarget: z.enum(["result", "answer"]).optional(),
});
export type BitEdge = z.infer<typeof BitEdgeSchema>;

export const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
});
export type Viewport = z.infer<typeof ViewportSchema>;

export const BitflowMetaSchema = z.object({
  /**
   * Stable identity of the assessment. An attempt snapshot records it so a
   * host cannot restore an attempt into a different flow.
   */
  id: z.string().min(1),
  title: z.string().default(""),
  description: z.string().optional(),
  locale: LocaleSchema.default("en"),
  /**
   * Ask the learner how sure they are after each task. A whole-flow setting
   * rather than a per-task one: being asked on some questions and not others
   * reads as a hint about which ones are hard.
   */
  askConfidence: z.boolean().default(false),
  /** Ask the learner to explain their reasoning after each task. */
  askReasoning: z.boolean().default(false),
  /**
   * Groups of interchangeable steps, of which each learner gets a random few.
   *
   * The members stay ordinary nodes wired into the graph as usual; drawing
   * only decides which of them a given attempt walks through, and the rest are
   * stepped over as though they were not there. That keeps pools out of every
   * bit, out of the condition language, and out of the report — which already
   * copes with learners who saw different items, because branching does the
   * same thing.
   */
  pools: z
    .array(
      z.object({
        id: z.string().min(1),
        /** Shown to the author. Learners never see it. */
        label: z.string().default(""),
        /** How many members each learner gets. */
        draw: z.number().int().positive(),
        /**
         * Show the drawn members in a random order rather than the order they
         * are wired in.
         *
         * The draw was always recorded in the order it happened; until this
         * existed nothing read that order back, so "the same ten questions,
         * shuffled" — which is what most people mean by a randomised test —
         * could not be expressed at all. A shuffled pool navigates by its drawn
         * order instead of by its internal edges, so it must have exactly one
         * way out; `validateFlow` says so when it does not. The way in needs no
         * such rule — every edge into a shuffled pool lands on whichever member
         * the draw put first.
         */
        shuffle: z.boolean().default(false),
      }),
    )
    .default([]),
  /**
   * Named runs of steps that belong together.
   *
   * A section carries the thing its steps share and the flow had nowhere to
   * put: the passage, listing or diagram every question in it refers to. Before
   * this, a reading comprehension with five questions meant pasting the passage
   * into all five, because a content step shows its text once and is gone.
   *
   * It is also a scope — `ScopeSchema` — so "did they pass this section" is a
   * branch rather than a hand-listed set of node ids, and the name shows on the
   * progress line so a learner knows where they are in a long assessment.
   */
  sections: z
    .array(
      z.object({
        id: z.string().min(1),
        /** Shown to the learner above every step in the section. */
        label: z.string().default(""),
        /**
         * Markdown rendered above every step in the section — the passage, the
         * code listing, the data table the questions are about.
         */
        markdown: z.string().default(""),
      }),
    )
    .default([]),
  /**
   * How freely the learner may move.
   *
   * - `linear` — forwards only. An exam.
   * - `back` — they may step back through what they have seen. The default,
   *   and what the runtime always did.
   * - `free` — they may jump to any step they have already visited, from a
   *   list. That list doubles as the check-your-work screen before finishing.
   *
   * Going back re-runs the branch on the way forward again, in every mode: an
   * answer changed on the second pass has to be able to send them elsewhere.
   */
  navigation: z.enum(["linear", "back", "free"]).default("back"),
  /**
   * Whether a learner may pass on a task without answering. A task may
   * override it — `EvaluationSchema.allowSkip` — for the one question everyone
   * has to attempt.
   */
  allowSkip: z.boolean().default(true),
  /**
   * Seconds for the whole assessment. Counted as time actually spent, not wall
   * clock: closing the tab pauses it. That is both fairer and the only rule
   * that survives a reload, since a snapshot records time per task rather than
   * a deadline.
   */
  timeLimit: z.number().int().positive().optional(),
});
export type BitflowMeta = z.infer<typeof BitflowMetaSchema>;

export const BitflowDocumentSchema = z.object({
  version: z.literal(FLOW_SCHEMA_VERSION),
  meta: BitflowMetaSchema,
  nodes: z.array(BitNodeSchema),
  edges: z.array(BitEdgeSchema),
  /** Editor camera. Presentation only; never affects a learner's run. */
  viewport: ViewportSchema.optional(),
});
export type BitflowDocument = z.infer<typeof BitflowDocumentSchema>;

// --- bit results ------------------------------------------------------------

export const FeedbackMessageSchema = z.object({
  message: z.string(),
  severity: z.enum(["error", "warning", "info", "success"]),
});
export type FeedbackMessage = z.infer<typeof FeedbackMessageSchema>;

/**
 * Evaluation settings every task bit offers, so a teacher meets the same three
 * questions — how is it graded, may they retry, do they see feedback — in every
 * task editor.
 *
 * `mode` decides what submitting does: `auto` grades it in the browser, `skip`
 * shows it but never grades or scores it.
 */
export const EvaluationSchema = z.object({
  mode: z.enum(["auto", "skip"]).default("auto"),
  enableRetry: z.boolean().default(false),
  showFeedback: z.boolean().default(true),
  /**
   * What this task is worth relative to the others. The runtime multiplies the
   * bit's own score by it, so a bit never has to think about weighting — and a
   * new bit gets it without doing anything.
   */
  weight: z.number().min(0).default(1),
  /**
   * Seconds the learner gets on this task, counted from when they arrive.
   * Omitted means no limit.
   */
  timeLimit: z.number().int().positive().optional(),
  /**
   * Whether this task may be passed on. Omitted follows the flow's
   * `meta.allowSkip`, which is the answer for all but the odd question that
   * everyone has to attempt.
   */
  allowSkip: z.boolean().optional(),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

/**
 * The grading settings a task starts with.
 *
 * Bits use this rather than writing the object out, so adding a setting here
 * reaches every bit at once instead of breaking each one's defaults.
 */
export const defaultEvaluation = (): Evaluation => EvaluationSchema.parse({});

export const BitResultSchema = z.object({
  state: BitResultStateSchema,
  /** Omitted means "worth one point, earned iff correct". */
  score: z
    .object({ earned: z.number(), possible: z.number().nonnegative() })
    .optional(),
  feedback: z.array(FeedbackMessageSchema).optional(),
  /** Whether the learner may try again, when the bit allows retries at all. */
  allowRetry: z.boolean().optional(),
  /** Bit-specific extras, e.g. which choices were right. */
  detail: z.record(z.string(), z.unknown()).optional(),
});
export type BitResult = z.infer<typeof BitResultSchema>;

// --- attempt snapshot -------------------------------------------------------

/**
 * Version of the attempt snapshot format, independent of the document format.
 */
export const ATTEMPT_SCHEMA_VERSION = 1;

export const ConfidenceSchema = z.object({
  /** `0`–`1`; how sure the learner said they were. */
  level: z.number().min(0).max(1),
});
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const AttemptStatusSchema = z.enum([
  "inProgress",
  "completed",
  "abandoned",
]);
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;

/**
 * Everything needed to resume a run. Serializable by construction: the host
 * persists it verbatim (see `bitflow-statechange`) and hands it back later.
 *
 * `history`, `elapsedMs` and `enteredAt` are part of version 1 because
 * "go back" and per-node timings cannot be reconstructed from the graph once
 * branching is condition-driven.
 */
export const AttemptSnapshotSchema = z.object({
  schemaVersion: z.literal(ATTEMPT_SCHEMA_VERSION),
  flowId: z.string().min(1),
  flowSchemaVersion: z.number().int(),
  attemptId: z.string().min(1),
  status: AttemptStatusSchema,
  currentNodeId: z.string().min(1),
  /** Visited node ids, oldest first, including the current one. */
  history: z.array(z.string().min(1)),
  answers: z.record(z.string(), z.unknown()),
  results: z.record(z.string(), BitResultSchema),
  tries: z.record(z.string(), z.number().int().nonnegative()),
  elapsedMs: z.record(z.string(), z.number().nonnegative()),
  /**
   * Pool id → the node ids this attempt drew, in the order they were drawn.
   *
   * Recorded rather than re-rolled, so a reload resumes the same assessment.
   * A pool the document has gained since is drawn on first use; one it has
   * lost is simply never consulted again.
   */
  pools: z.record(z.string(), z.array(z.string())).default({}),
  confidence: z.record(z.string(), ConfidenceSchema).optional(),
  reasoning: z.record(z.string(), z.string()).optional(),
  startedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  /** Timestamp the current node was entered; drives `elapsedMs`. */
  enteredAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
});
export type AttemptSnapshot = z.infer<typeof AttemptSnapshotSchema>;
