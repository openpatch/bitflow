import type { z } from "zod";
import type { Diagnostic } from "./errors";
import type {
  AttemptSnapshot,
  BitflowDocument,
  BitResult,
  Locale,
} from "./schema";

/**
 * A component supplied by a bit package.
 *
 * Deliberately not typed as a React component: `@bitflow/core` must stay
 * importable from Node and must not depend on React. A React function
 * component is structurally assignable to this, and the React layer narrows it
 * back with a cast at the one place it renders.
 */
export type BitComponent<Props = any> = (props: Props) => unknown;

/**
 * What a bit is for, which is all the engine needs to know about it:
 * - `start`/`end` bookend a run (`end` is terminal),
 * - `task` accepts an answer and can be evaluated and scored,
 * - `content` is shown and clicked past (titles, explanations, inputs).
 */
export const BIT_KINDS = ["start", "content", "task", "end"] as const;
export type BitKind = (typeof BIT_KINDS)[number];

export type EvaluateArgs<Data, Answer> = {
  data: Data;
  answer: Answer;
};

export type Evaluate<Data = any, Answer = any> = (
  args: EvaluateArgs<Data, Answer>,
) => BitResult | Promise<BitResult>;

export type BitInfo = {
  name: string;
  description: string;
};

/**
 * What every bit's learner-facing `Task` component is handed. Declared here,
 * without React, so a bit package can type its component against the contract
 * the flow and the standalone element both honour.
 */
export type BitTaskProps<Data = any, Answer = any> = {
  data: Data;
  answer?: Answer;
  /** Present once evaluated; the view switches to showing the outcome. */
  result?: BitResult;
  /** Answered already, or being reviewed — render, but accept no input. */
  readonly?: boolean;
  locale: Locale;
  onAnswerChange: (answer: Answer) => void;
  /**
   * The run so far, when there is one. Only `end` bits have any use for it —
   * they summarise the attempt the learner just finished. A bit rendered
   * standalone has no attempt, so anything reading this must cope without it.
   */
  attempt?: AttemptSnapshot;
  /**
   * The document being run, paired with `attempt`. An end bit needs it to turn
   * the node ids in a snapshot back into tasks it can show. Absent for a bit
   * rendered on its own.
   */
  flow?: BitflowDocument;
};

/** What every bit's author-facing `Form` component is handed. */
export type BitFormProps<Data = any> = {
  data: Data;
  locale: Locale;
  onChange: (data: Data) => void;
  /**
   * Validation problems for this node's data, with `path` relative to `data`,
   * so the form can put each message next to the field that caused it.
   */
  errors?: Diagnostic[];
};

export type BitDefinition<Data = any, Answer = any> = {
  /** Matches `BitNode.type`, e.g. `"task-choice"`. */
  type: string;
  kind: BitKind;
  /** Validates `BitNode.data`. The envelope schema defers to this. */
  schema: z.ZodType<Data>;
  /** New-node data for the editor palette. Must satisfy `schema`. */
  defaultData: () => Data;
  /** Palette label and one-line help, per locale. */
  info: (locale: Locale) => BitInfo;
  /** Required for `kind: "task"`; how an answer becomes a result. */
  evaluate?: Evaluate<Data, Answer>;
  /** The learner-facing view. */
  Task?: BitComponent;
  /** Author-facing form for the bit's evaluation settings. */
  Evaluation?: BitComponent;
  /** Author-facing form for the bit's feedback settings. */
  Feedback?: BitComponent;
  /** Renders group statistics for this bit type. */
  Statistic?: BitComponent;
  /** Author-facing form for the bit's content. */
  Form?: BitComponent;
};

const registry = new Map<string, BitDefinition>();

/**
 * Called by a bit package at module scope. Importing the package is the single
 * action that makes its bit usable — inside a flow and as a standalone custom
 * element alike.
 *
 * Re-registering the same type replaces the previous definition rather than
 * throwing: two bundles on one page (say the editor and a standalone bit) may
 * legitimately both load a bit, and the definitions are equivalent.
 */
export const registerBit = <Data, Answer>(
  definition: BitDefinition<Data, Answer>,
): void => {
  registry.set(definition.type, definition as BitDefinition);
};

export const getBit = (type: string): BitDefinition | undefined =>
  registry.get(type);

export const hasBit = (type: string): boolean => registry.has(type);

export const listBits = (): BitDefinition[] => Array.from(registry.values());

/** Test seam; not part of the public runtime story. */
export const clearBits = (): void => {
  registry.clear();
};
