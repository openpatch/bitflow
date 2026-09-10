import { clearBits, registerBit, type BitflowDocument } from "@bitflow/core";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { outlineOf } from "./schema";

/**
 * Stand-ins rather than real bit packages: start-simple must not depend on
 * one, or the dependency direction that keeps bits lazily loadable is
 * inverted. All the outline asks of a bit is whether it is a task.
 */
beforeEach(() => {
  clearBits();
  for (const [type, kind] of [
    ["test-start", "start"],
    ["test-content", "content"],
    ["test-task", "task"],
    ["test-end", "end"],
  ] as const) {
    registerBit({
      type,
      kind,
      schema: z.object({}),
      defaultData: () => ({}),
      info: () => ({ name: type, description: "" }),
    });
  }
});

const node = (id: string, type: string, pool?: string) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {},
  ...(pool ? { pool } : {}),
});

const flow = (
  nodes: ReturnType<typeof node>[],
  meta: Partial<BitflowDocument["meta"]> = {},
): BitflowDocument => ({
  version: 1,
  meta: {
    id: "outline",
    title: "",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
    pools: [],
    sections: [],
    navigation: "back",
    allowSkip: true,
    ...meta,
  },
  nodes,
  edges: [],
});

describe("outlineOf", () => {
  it("has nothing to say without a document", () => {
    // A start bit shown on its own, as in an author's preview, knows of no
    // assessment to describe.
    expect(outlineOf(undefined)).toBeUndefined();
  });

  it("counts the tasks and nothing else", () => {
    const outline = outlineOf(
      flow([
        node("start", "test-start"),
        node("intro", "test-content"),
        node("q1", "test-task"),
        node("q2", "test-task"),
        node("end", "test-end"),
      ]),
    );
    expect(outline?.questions).toBe(2);
  });

  it("counts what a pool hands out, not what it holds", () => {
    const outline = outlineOf(
      flow(
        [
          node("start", "test-start"),
          node("q1", "test-task", "bank"),
          node("q2", "test-task", "bank"),
          node("q3", "test-task", "bank"),
          node("q4", "test-task"),
        ],
        { pools: [{ id: "bank", label: "", draw: 2, shuffle: false }] },
      ),
    );
    expect(outline?.questions).toBe(3);
  });

  it("promises no more than a pool actually has", () => {
    const outline = outlineOf(
      flow([node("q1", "test-task", "bank")], {
        pools: [{ id: "bank", label: "", draw: 5, shuffle: false }],
      }),
    );
    expect(outline?.questions).toBe(1);
  });

  it("reports the limit and whether they can go back", () => {
    expect(outlineOf(flow([]))).toMatchObject({
      timeLimit: undefined,
      canGoBack: true,
    });
    expect(
      outlineOf(flow([], { timeLimit: 600, navigation: "linear" })),
    ).toMatchObject({ timeLimit: 600, canGoBack: false });
  });
});
