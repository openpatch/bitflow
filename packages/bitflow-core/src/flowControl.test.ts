import { beforeEach, describe, expect, it } from "vitest";
import {
  createAttempt,
  evaluateNode,
  goNext,
  goPrevious,
  goTo,
  canGoPrevious,
  setAnswer,
  setConfidence,
} from "./attempt";
import {
  canGoTo,
  canSkip,
  conditionContext,
  flowProgress,
  poolExitEdges,
  sectionMembers,
  sectionOf,
  visitedSteps,
} from "./engine";
import { evaluateCondition, resolveValueRef } from "./condition";
import { validateFlow } from "./validate";
import { doc, edge, node, registerTestBits } from "./test-utils";
import type { AttemptSnapshot, BitflowDocument, Condition } from "./schema";

const start = (document: BitflowDocument): AttemptSnapshot => {
  const created = createAttempt(document);
  if (!created.ok) throw new Error(created.error.message);
  return created.value;
};

const answer = async (
  document: BitflowDocument,
  snapshot: AttemptSnapshot,
  given: string,
): Promise<AttemptSnapshot> => {
  const evaluated = await evaluateNode(
    document,
    snapshot,
    snapshot.currentNodeId,
    given,
  );
  if (!evaluated.ok) throw new Error(evaluated.error.message);
  return evaluated.value;
};

const messages = (document: BitflowDocument): string[] =>
  validateFlow(document).diagnostics.map((d) => d.message);

beforeEach(registerTestBits);

// --- remediation loops ------------------------------------------------------

describe("going back over an edge that resets", () => {
  /**
   * The shape a teacher draws for "get it wrong, read why, try again": the
   * question, an explanation reached only when the answer was wrong, and an
   * edge back to the question.
   */
  const loop = (resetTarget?: "result" | "answer") =>
    doc(
      [
        node("start", "test-start"),
        node("q", "test-task", { correct: "a" }),
        node("why", "test-content", { text: "Because." }),
        node("end", "test-end"),
      ],
      [
        edge("start", "q"),
        edge("q", "why", {
          condition: {
            type: "compare",
            left: { kind: "result", nodeId: "q", path: "state" },
            op: "eq",
            right: "wrong",
          } satisfies Condition,
        }),
        edge("q", "end"),
        edge("why", "q", { resetTarget }),
      ],
    );

  it("leaves the answer and the grading alone when the edge says nothing", async () => {
    const flow = loop();
    let attempt = goNext(flow, start(flow));
    attempt = await answer(flow, attempt, "wrong-answer");
    attempt = goNext(flow, attempt);
    expect(attempt.currentNodeId).toBe("why");

    attempt = goNext(flow, attempt);
    expect(attempt.currentNodeId).toBe("q");
    // Which is what "look at it again" means, and why it is not the default
    // for a loop that means "try again".
    expect(attempt.results.q).toEqual({ state: "wrong" });
    expect(attempt.answers.q).toBe("wrong-answer");
  });

  it("clears the grading and keeps the draft when it resets the result", async () => {
    const flow = loop("result");
    let attempt = goNext(flow, start(flow));
    attempt = await answer(flow, attempt, "wrong-answer");
    attempt = goNext(flow, attempt);
    attempt = goNext(flow, attempt);

    expect(attempt.currentNodeId).toBe("q");
    expect(attempt.results.q).toBeUndefined();
    expect(attempt.answers.q).toBe("wrong-answer");
  });

  it("clears the answer too when the task measures something", async () => {
    const flow = loop("answer");
    let attempt = goNext(flow, start(flow));
    attempt = await answer(flow, attempt, "wrong-answer");
    attempt = goNext(flow, attempt);
    attempt = goNext(flow, attempt);

    expect(attempt.results.q).toBeUndefined();
    expect(attempt.answers.q).toBeUndefined();
  });

  it("keeps the try count, which is the record of how many goes it took", async () => {
    const flow = loop("answer");
    let attempt = goNext(flow, start(flow));
    attempt = await answer(flow, attempt, "wrong-answer");
    attempt = goNext(flow, attempt);
    attempt = goNext(flow, attempt);
    attempt = await answer(flow, attempt, "a");

    expect(attempt.tries.q).toBe(2);
    expect(attempt.results.q).toEqual({ state: "correct" });
  });

  it("lets the loop finish once the answer is right", async () => {
    const flow = loop("result");
    let attempt = goNext(flow, start(flow));
    attempt = await answer(flow, attempt, "wrong");
    attempt = goNext(flow, attempt);
    attempt = goNext(flow, attempt);
    attempt = await answer(flow, attempt, "a");
    attempt = goNext(flow, attempt);

    expect(attempt.currentNodeId).toBe("end");
    expect(attempt.status).toBe("completed");
  });

  it("still reports how far there is to go while the loop is open", () => {
    // The route through the explanation is a cycle and cannot be measured;
    // the route straight on can, and that is the one progress reports.
    const flow = loop("result");
    const attempt = goNext(flow, start(flow));
    expect(flowProgress(flow, attempt).remaining).toBe(1);
  });
});

// --- what a branch can read -------------------------------------------------

describe("what a condition can read", () => {
  const flow = doc(
    [
      node("start", "test-start"),
      node("q1", "test-task", { correct: "a" }),
      node("q2", "test-task", { correct: "a" }),
      node("end", "test-end"),
    ],
    [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
    "readable",
    { askConfidence: true, timeLimit: 600 },
  );

  it("counts how many times a step has been shown", () => {
    let attempt = start(flow);
    attempt = { ...attempt, history: ["start", "q1", "why", "q1"] };
    const context = conditionContext(flow, attempt);
    expect(resolveValueRef({ kind: "visits", nodeId: "q1" }, context)).toBe(2);
    expect(resolveValueRef({ kind: "visits", nodeId: "q2" }, context)).toBe(0);
  });

  it("reads how sure the learner said they were", () => {
    let attempt = start(flow);
    attempt = setConfidence(attempt, "q1", { level: 1 });
    const context = conditionContext(flow, attempt);
    expect(resolveValueRef({ kind: "confidence", nodeId: "q1" }, context)).toBe(1);
  });

  it("has no confidence for a step nobody was asked about", () => {
    const context = conditionContext(flow, start(flow));
    expect(
      resolveValueRef({ kind: "confidence", nodeId: "q2" }, context),
    ).toBeUndefined();
  });

  it("never fires a confidence threshold for a learner who was not asked", () => {
    // The trap this guards: an absent confidence must not read as zero, or
    // "less than half sure" would be true of everyone the question skipped.
    const unsure: Condition = {
      type: "compare",
      left: { kind: "confidence", nodeId: "q2" },
      op: "lt",
      right: 0.5,
    };
    expect(evaluateCondition(unsure, conditionContext(flow, start(flow)))).toBe(
      false,
    );
  });

  it("reads the clock in seconds, spent and remaining", () => {
    const startedAt = new Date("2026-01-01T10:00:00.000Z");
    let attempt = start(flow);
    attempt = {
      ...attempt,
      startedAt: startedAt.toISOString(),
      enteredAt: startedAt.toISOString(),
      elapsedMs: { q1: 30_000 },
    };
    const context = conditionContext(
      flow,
      attempt,
      new Date("2026-01-01T10:00:20.000Z"),
    );

    expect(resolveValueRef({ kind: "timeSpent", nodeId: "q1" }, context)).toBe(30);
    // 30 banked plus the 20 seconds on the step in progress.
    expect(resolveValueRef({ kind: "timeSpent" }, context)).toBe(50);
    expect(resolveValueRef({ kind: "timeRemaining" }, context)).toBe(550);
  });

  it("has no time remaining to compare when the flow has no limit", () => {
    const unlimited = doc(flow.nodes, flow.edges, "unlimited");
    const context = conditionContext(unlimited, start(unlimited));
    expect(resolveValueRef({ kind: "timeRemaining" }, context)).toBeUndefined();
  });
});

// --- scoped counts ----------------------------------------------------------

describe("counting over a scope", () => {
  const flow = doc(
    [
      node("start", "test-start"),
      { ...node("a1", "test-task", { correct: "a" }), section: "reading" },
      { ...node("a2", "test-task", { correct: "a" }), section: "reading" },
      node("b1", "test-task", { correct: "a" }),
      node("end", "test-end"),
    ],
    [edge("start", "a1"), edge("a1", "a2"), edge("a2", "b1"), edge("b1", "end")],
    "scoped",
    {
      sections: [{ id: "reading", label: "Reading", markdown: "A passage." }],
    },
  );

  const answered: AttemptSnapshot = {
    ...start(flow),
    history: ["start", "a1", "a2", "b1"],
    results: {
      a1: { state: "correct" },
      a2: { state: "wrong" },
      b1: { state: "correct" },
    },
  };

  const context = () => conditionContext(flow, answered);

  it("counts the whole attempt when there is no scope", () => {
    expect(
      resolveValueRef({ kind: "resultCount", state: "correct" }, context()),
    ).toBe(2);
  });

  it("counts one section", () => {
    expect(
      resolveValueRef(
        {
          kind: "resultCount",
          state: "correct",
          scope: { kind: "section", id: "reading" },
        },
        context(),
      ),
    ).toBe(1);
  });

  it("scores one section", () => {
    expect(
      resolveValueRef(
        { kind: "scoreRatio", scope: { kind: "section", id: "reading" } },
        context(),
      ),
    ).toBe(0.5);
  });

  it("counts a hand-picked set of steps", () => {
    expect(
      resolveValueRef(
        {
          kind: "resultCount",
          state: "correct",
          scope: { kind: "nodes", nodeIds: ["a2", "b1"] },
        },
        context(),
      ),
    ).toBe(1);
  });

  it("counts back through the last few answered, newest first", () => {
    expect(
      resolveValueRef(
        {
          kind: "resultCount",
          state: "correct",
          scope: { kind: "last", count: 2 },
        },
        context(),
      ),
    ).toBe(1);
  });

  it("counts a step reached twice only once", () => {
    const looped = { ...answered, history: [...answered.history, "a2", "b1"] };
    expect(
      resolveValueRef(
        {
          kind: "resultCount",
          state: "correct",
          scope: { kind: "last", count: 3 },
        },
        conditionContext(flow, looped),
      ),
    ).toBe(2);
  });
});

// --- sections ---------------------------------------------------------------

describe("sections", () => {
  const flow = doc(
    [
      node("start", "test-start"),
      { ...node("q1", "test-task", { correct: "a" }), section: "reading" },
      { ...node("q2", "test-task", { correct: "a" }), section: "reading" },
      node("end", "test-end"),
    ],
    [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
    "sectioned",
    {
      sections: [
        { id: "reading", label: "Reading", markdown: "Once upon a time." },
      ],
    },
  );

  it("finds the section a step belongs to", () => {
    expect(sectionOf(flow, flow.nodes[1])?.markdown).toBe("Once upon a time.");
    expect(sectionOf(flow, flow.nodes[0])).toBeUndefined();
  });

  it("collects a section's members off the nodes", () => {
    expect(sectionMembers(flow, "reading").map((n) => n.id)).toEqual([
      "q1",
      "q2",
    ]);
  });

  it("reports a step in a section the flow does not declare", () => {
    const stray = doc(
      [
        node("start", "test-start"),
        { ...node("q", "test-task", { correct: "a" }), section: "ghost" },
        node("end", "test-end"),
      ],
      [edge("start", "q"), edge("q", "end")],
      "stray-section",
    );
    expect(messages(stray).join(" ")).toContain("does not declare");
  });

  it("reports a section with nothing in it", () => {
    const empty = doc(
      [node("start", "test-start"), node("end", "test-end")],
      [edge("start", "end")],
      "empty-section",
      { sections: [{ id: "reading", label: "Reading", markdown: "..." }] },
    );
    expect(messages(empty).join(" ")).toContain("has no steps in it");
  });

  it("refuses a start or end inside a section", () => {
    const bad = doc(
      [
        node("start", "test-start"),
        { ...node("end", "test-end"), section: "reading" },
      ],
      [edge("start", "end")],
      "sectioned-end",
      { sections: [{ id: "reading", label: "", markdown: "" }] },
    );
    expect(messages(bad).join(" ")).toContain("cannot be part of a section");
  });

  it("reports a rule that counts a section the flow does not declare", () => {
    const bad = doc(
      flow.nodes,
      [
        ...flow.edges.filter((e) => e.id !== "q2->end"),
        edge("q2", "end", {
          condition: {
            type: "compare",
            left: {
              kind: "resultCount",
              state: "correct",
              scope: { kind: "section", id: "ghost" },
            },
            op: "gte",
            right: 1,
          } satisfies Condition,
        }),
      ],
      "ghost-scope",
      flow.meta,
    );
    expect(messages(bad).join(" ")).toContain('section "ghost"');
  });

  it("reports a section threshold higher than the section can reach", () => {
    const bad = doc(
      flow.nodes,
      [
        ...flow.edges.filter((e) => e.id !== "q2->end"),
        edge("q2", "end", {
          condition: {
            type: "compare",
            left: {
              kind: "resultCount",
              state: "correct",
              scope: { kind: "section", id: "reading" },
            },
            op: "gte",
            right: 5,
          } satisfies Condition,
        }),
      ],
      "too-high",
      flow.meta,
    );
    expect(messages(bad).join(" ")).toContain("can never be reached");
  });
});

// --- shuffled pools ---------------------------------------------------------

describe("a pool that shuffles", () => {
  const flow = (shuffle = true, draw = 4): BitflowDocument =>
    doc(
      [
        node("start", "test-start"),
        { ...node("q1", "test-task", { correct: "a" }), pool: "questions" },
        { ...node("q2", "test-task", { correct: "a" }), pool: "questions" },
        { ...node("q3", "test-task", { correct: "a" }), pool: "questions" },
        { ...node("q4", "test-task", { correct: "a" }), pool: "questions" },
        node("end", "test-end"),
      ],
      [
        edge("start", "q1"),
        edge("q1", "q2"),
        edge("q2", "q3"),
        edge("q3", "q4"),
        edge("q4", "end"),
      ],
      "shuffled",
      { pools: [{ id: "questions", label: "Questions", draw, shuffle }] },
    );

  /** Walks the flow, answering everything, and reports the steps seen. */
  const walk = (
    document: BitflowDocument,
    order?: string[],
  ): string[] => {
    let attempt: AttemptSnapshot = {
      ...start(document),
      pools: order ? { questions: order } : {},
    };
    const seen = [attempt.currentNodeId];
    for (let step = 0; step < 20; step++) {
      attempt = setAnswer(attempt, attempt.currentNodeId, "a");
      const next = goNext(document, attempt);
      if (next.currentNodeId === attempt.currentNodeId) break;
      attempt = next;
      seen.push(attempt.currentNodeId);
      if (attempt.status !== "inProgress") break;
    }
    return seen;
  };

  it("shows the members in the order the attempt drew, not as wired", () => {
    expect(walk(flow(), ["q3", "q1", "q4", "q2"])).toEqual([
      "start",
      "q3",
      "q1",
      "q4",
      "q2",
      "end",
    ]);
  });

  it("enters at the first member drawn, whichever one the edge points at", () => {
    expect(walk(flow(), ["q4", "q2"])[1]).toBe("q4");
  });

  it("leaves by the pool's exit however the order ended", () => {
    expect(walk(flow(), ["q2", "q3"])).toEqual(["start", "q2", "q3", "end"]);
  });

  it("walks it as it is wired when the attempt has no draw recorded", () => {
    // An older snapshot, or a pool added since. Hiding or reordering steps on
    // the strength of missing data is the worse failure.
    expect(walk(flow())).toEqual([
      "start",
      "q1",
      "q2",
      "q3",
      "q4",
      "end",
    ]);
  });

  it("is unchanged when the pool does not shuffle", () => {
    expect(walk(flow(false), ["q3", "q1"])).toEqual([
      "start",
      "q1",
      "q3",
      "end",
    ]);
  });

  it("finds the edges that leave the pool", () => {
    expect(poolExitEdges(flow(), "questions").map((e) => e.id)).toEqual([
      "q4->end",
    ]);
  });

  it("does not complain that a shuffled pool draws all of its members", () => {
    expect(messages(flow(true, 4)).join(" ")).not.toContain(
      "every learner gets the same",
    );
    expect(messages(flow(false, 4)).join(" ")).toContain(
      "every learner gets the same",
    );
  });

  it("reports a shuffled pool with more than one way out", () => {
    const forked = flow();
    const bad = doc(
      forked.nodes,
      [...forked.edges, edge("q2", "end", { id: "q2->end" })],
      "two-exits",
      forked.meta,
    );
    expect(messages(bad).join(" ")).toContain("lead out of it");
  });

  it("reports a shuffled pool with no way out", () => {
    const bad = doc(
      [
        node("start", "test-start"),
        { ...node("q1", "test-task", { correct: "a" }), pool: "questions" },
        { ...node("q2", "test-task", { correct: "a" }), pool: "questions" },
      ],
      [edge("start", "q1"), edge("q1", "q2"), edge("q2", "q1")],
      "no-exit",
      { pools: [{ id: "questions", label: "", draw: 2, shuffle: true }] },
    );
    expect(messages(bad).join(" ")).toContain("Nothing leads out of");
  });
});

// --- navigation policy ------------------------------------------------------

describe("how freely the learner may move", () => {
  const flow = (navigation: "linear" | "back" | "free") =>
    doc(
      [
        node("start", "test-start"),
        node("q1", "test-task", { correct: "a" }),
        node("q2", "test-task", { correct: "a" }),
        node("end", "test-end"),
      ],
      [edge("start", "q1"), edge("q1", "q2"), edge("q2", "end")],
      `nav-${navigation}`,
      { navigation },
    );

  const atSecondQuestion = (document: BitflowDocument): AttemptSnapshot => {
    let attempt = goNext(document, start(document));
    attempt = setAnswer(attempt, "q1", "a");
    return goNext(document, attempt);
  };

  it("offers no way back in a linear flow", () => {
    const document = flow("linear");
    const attempt = atSecondQuestion(document);
    expect(canGoPrevious(document, attempt)).toBe(false);
    expect(goPrevious(document, attempt)).toBe(attempt);
  });

  it("steps back one at a time by default", () => {
    const document = flow("back");
    const attempt = atSecondQuestion(document);
    expect(canGoPrevious(document, attempt)).toBe(true);
    expect(goPrevious(document, attempt).currentNodeId).toBe("q1");
  });

  it("only offers a jump when the flow allows free movement", () => {
    expect(canGoTo(flow("back"), atSecondQuestion(flow("back")), "start")).toBe(
      false,
    );
    expect(canGoTo(flow("free"), atSecondQuestion(flow("free")), "start")).toBe(
      true,
    );
  });

  it("refuses a jump forwards, which depends on answers not yet given", () => {
    const document = flow("free");
    expect(canGoTo(document, atSecondQuestion(document), "end")).toBe(false);
  });

  it("jumps back and re-runs the branches on the way forward again", () => {
    const document = flow("free");
    const attempt = goTo(document, atSecondQuestion(document), "q1");
    expect(attempt.currentNodeId).toBe("q1");
    expect(attempt.history).toEqual(["start", "q1"]);
    // The answer stays: a jump is a change of view, not an undo.
    expect(attempt.answers.q1).toBe("a");
  });

  it("lists the steps visited, once each, saying what is outstanding", () => {
    const document = flow("free");
    const steps = visitedSteps(document, atSecondQuestion(document));
    expect(steps.map((s) => s.nodeId)).toEqual(["start", "q1", "q2"]);
    expect(steps.map((s) => s.outstanding)).toEqual([false, true, true]);
    expect(steps.at(-1)?.current).toBe(true);
  });

  it("shows a step reached twice where it was first met", () => {
    const document = flow("free");
    const attempt = {
      ...atSecondQuestion(document),
      history: ["start", "q1", "q2", "q1"],
    };
    expect(visitedSteps(document, attempt).map((s) => s.nodeId)).toEqual([
      "start",
      "q1",
      "q2",
    ]);
  });
});

describe("passing on a task", () => {
  const flow = (allowSkip: boolean, evaluation?: Record<string, unknown>) =>
    doc(
      [
        node("start", "test-start"),
        node("q", "test-task", { correct: "a", evaluation }),
        node("end", "test-end"),
      ],
      [edge("start", "q"), edge("q", "end")],
      "skippable",
      { allowSkip },
    );

  it("follows the flow when the task says nothing", () => {
    expect(canSkip(flow(true), flow(true).nodes[1])).toBe(true);
    expect(canSkip(flow(false), flow(false).nodes[1])).toBe(false);
  });

  it("lets one task insist on an answer in a flow that allows skipping", () => {
    const document = flow(true, { allowSkip: false });
    expect(canSkip(document, document.nodes[1])).toBe(false);
  });

  it("lets one task be optional in a flow that does not allow skipping", () => {
    const document = flow(false, { allowSkip: true });
    expect(canSkip(document, document.nodes[1])).toBe(true);
  });
});
