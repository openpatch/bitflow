import { z } from "zod";
import { clearBits, registerBit } from "./registry";
import {
  FLOW_SCHEMA_VERSION,
  type BitEdge,
  type BitflowDocument,
  type BitNode,
} from "./schema";

/**
 * Fixtures and builders for this package's own tests. Replaces the published
 * `@bitflow/mock` package, which existed only to share these with other
 * packages — each package now colocates the helpers its tests need.
 */

export const node = (
  id: string,
  type: string,
  data: Record<string, unknown> = {},
): BitNode => ({ id, type, position: { x: 0, y: 0 }, data });

export const edge = (
  source: string,
  target: string,
  extra: Partial<BitEdge> = {},
): BitEdge => ({ id: `${source}->${target}`, source, target, ...extra });

export const doc = (
  nodes: BitNode[],
  edges: BitEdge[],
  id = "test-flow",
): BitflowDocument => ({
  version: FLOW_SCHEMA_VERSION,
  meta: { id, title: "Test flow", locale: "en" },
  nodes,
  edges,
});

/**
 * Minimal stand-ins for real bits: a start, an end, a content bit and a task
 * whose answer is simply compared against `data.correct`. Enough to exercise
 * traversal, evaluation and scoring without depending on any bit package
 * (which would invert the dependency direction).
 */
export const registerTestBits = (): void => {
  clearBits();

  registerBit({
    type: "test-start",
    kind: "start",
    schema: z.object({}),
    defaultData: () => ({}),
    info: () => ({ name: "Start", description: "Test start" }),
  });

  registerBit({
    type: "test-content",
    kind: "content",
    schema: z.object({ text: z.string().default("") }),
    defaultData: () => ({ text: "" }),
    info: () => ({ name: "Content", description: "Test content" }),
  });

  registerBit({
    type: "test-task",
    kind: "task",
    schema: z.object({ correct: z.string() }),
    defaultData: () => ({ correct: "a" }),
    info: () => ({ name: "Task", description: "Test task" }),
    evaluate: ({ data, answer }) => ({
      state: answer === (data as { correct: string }).correct ? "correct" : "wrong",
    }),
  });

  registerBit({
    type: "test-end",
    kind: "end",
    schema: z.object({}),
    defaultData: () => ({}),
    info: () => ({ name: "End", description: "Test end" }),
  });
};
