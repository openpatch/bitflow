// @vitest-environment node
//
// These assertions are about data and pure functions, and the file reads the
// committed fixtures off disk — so it runs in Node rather than jsdom, where
// `node:fs` is not available.
import {
  AttemptSnapshotSchema,
  createAttempt,
  evaluateNode,
  goNext,
  parseFlow,
  restoreAttempt,
  validateFlow,
  type BitflowDocument,
} from "@bitflow/core";
import { computeGroupStatistics, parseReport, parseReports } from "@bitflow/report";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { loadAllBits } from "./bitLoaders";

/**
 * The golden fixtures, asserted against behaviour rather than only against
 * `JSON.parse`. Each one exists to pin a specific outcome down, and this is
 * where that outcome is written.
 */

const FIXTURES = resolve(import.meta.dirname, "..", "..", "..", "fixtures");
const read = (path: string) =>
  JSON.parse(readFileSync(resolve(FIXTURES, path), "utf8"));

const parsed = (path: string): BitflowDocument => {
  const result = parseFlow(read(path));
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

beforeAll(async () => {
  // Bit-aware validation needs the registry populated.
  expect(await loadAllBits()).toEqual([]);
});

describe("fixtures/flows/minimal.bitflow", () => {
  it("parses and validates", () => {
    expect(validateFlow(parsed("flows/minimal.bitflow"))).toEqual({
      valid: true,
      diagnostics: [],
    });
  });

  it("can be taken from start to end", async () => {
    const doc = parsed("flows/minimal.bitflow");
    const created = createAttempt(doc);
    if (!created.ok) throw new Error(created.error.message);

    let attempt = created.value;
    expect(attempt.currentNodeId).toBe("start");

    attempt = goNext(doc, attempt);
    attempt = goNext(doc, attempt);
    expect(attempt.currentNodeId).toBe("question");

    const evaluated = await evaluateNode(doc, attempt, "question", {
      selected: ["c-2", "c-7"],
    });
    if (!evaluated.ok) throw new Error(evaluated.error.message);
    expect(evaluated.value.results.question.state).toBe("correct");

    attempt = goNext(doc, evaluated.value);
    expect(attempt.currentNodeId).toBe("end");
    expect(attempt.status).toBe("completed");
  });
});

describe("fixtures/flows/all-initial-bits.bitflow", () => {
  it("parses and validates", () => {
    expect(validateFlow(parsed("flows/all-initial-bits.bitflow"))).toEqual({
      valid: true,
      diagnostics: [],
    });
  });

  it("uses each of the nine initial bit types exactly once", () => {
    const types = parsed("flows/all-initial-bits.bitflow").nodes.map((n) => n.type);
    expect(new Set(types).size).toBe(9);
    expect(types).toHaveLength(9);
  });
});

describe("fixtures/flows/invalid-unknown-bit.bitflow", () => {
  it("has a valid envelope — the problem is the bit, not the file", () => {
    expect(parseFlow(read("flows/invalid-unknown-bit.bitflow")).ok).toBe(true);
  });

  it("is reported as an unknown bit type", () => {
    const { diagnostics } = validateFlow(parsed("flows/invalid-unknown-bit.bitflow"));
    expect(
      diagnostics.some((d) => d.message.includes('Unknown bit type "task-from-the-future"')),
    ).toBe(true);
  });
});

describe("fixtures/flows/invalid-graph.bitflow", () => {
  const diagnostics = () =>
    validateFlow(parsed("flows/invalid-graph.bitflow")).diagnostics;

  it("reports the edge pointing at a node that is not there", () => {
    expect(
      diagnostics().some((d) => d.message.includes('"does-not-exist"')),
    ).toBe(true);
  });

  it("reports the condition referring to a node that is not there", () => {
    expect(
      diagnostics().some((d) => d.message.includes('"no-such-node"')),
    ).toBe(true);
  });

  it("reports the unreachable island", () => {
    expect(
      diagnostics().some((d) => d.message.includes('"island" cannot be reached')),
    ).toBe(true);
  });

  it("gives every diagnostic a path to the offending field", () => {
    for (const diagnostic of diagnostics()) {
      expect(diagnostic.path).toMatch(/^(nodes|edges)/);
    }
  });
});

describe("fixtures/attempts", () => {
  const doc = () => parsed("flows/minimal.bitflow");

  it("in-progress.json matches the snapshot schema", () => {
    expect(AttemptSnapshotSchema.safeParse(read("attempts/in-progress.json")).success).toBe(
      true,
    );
  });

  it("in-progress.json restores into the flow it belongs to", () => {
    const restored = restoreAttempt(doc(), read("attempts/in-progress.json"));
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.value.currentNodeId).toBe("question");
      expect(restored.value.answers.question).toEqual({ selected: ["c-2", "c-7"] });
      expect(restored.value.results.question.state).toBe("correct");
      expect(restored.value.tries.question).toBe(1);
      expect(restored.value.confidence?.question).toEqual({ level: 0.8 });
      expect(restored.value.reasoning?.question).toBeTruthy();
      expect(restored.value.status).toBe("inProgress");
    }
  });

  it("wrong-flow.json is refused with FLOW_ATTEMPT_MISMATCH", () => {
    const restored = restoreAttempt(doc(), read("attempts/wrong-flow.json"));
    expect(restored.ok).toBe(false);
    if (!restored.ok) expect(restored.error.code).toBe("FLOW_ATTEMPT_MISMATCH");
  });
});

describe("fixtures/reports", () => {
  it("single.json parses and records a partly-right run", () => {
    const parsedReport = parseReport(read("reports/single.json"));
    expect(parsedReport.ok).toBe(true);
    if (parsedReport.ok) {
      expect(parsedReport.value.status).toBe("completed");
      expect(parsedReport.value.nodeReports).toHaveLength(1);
      expect(parsedReport.value.nodeReports[0].result?.state).toBe("wrong");
      expect(parsedReport.value.score).toEqual({ earned: 0, possible: 1 });
      expect(parsedReport.value.subject?.label).toBe("Alex");
    }
  });

  describe("group.json", () => {
    const reports = () => {
      const result = parseReports(read("reports/group.json"));
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    };

    it("parses as an array of reports", () => {
      expect(reports()).toHaveLength(6);
    });

    it("produces the aggregates the fixture was built for", () => {
      const stats = computeGroupStatistics(reports());

      expect(stats.learners).toBe(6);
      // Four of the six answered correctly, by construction.
      expect(stats.items).toHaveLength(1);
      expect(stats.items[0].counts).toMatchObject({ correct: 4, wrong: 2 });
      expect(stats.items[0].difficulty).toBeCloseTo(4 / 6, 10);
      expect(stats.summary?.mean).toBeCloseTo(4 / 6, 10);
      expect(stats.summary?.max).toBe(1);
      expect(stats.summary?.min).toBe(0);
    });

    it("ranks the four who were right above the two who were not", () => {
      const stats = computeGroupStatistics(reports());
      const byLabel = Object.fromEntries(
        stats.scores.map((score) => [score.label, score.rank]),
      );
      expect(byLabel.Alex).toBe(1);
      expect(byLabel.Dee).toBe(1);
      expect(byLabel.Eli).toBe(5);
      expect(byLabel.Fay).toBe(5);
    });

    it("declines to report reliability from a single item", () => {
      // Cronbach's alpha needs at least two items; the fixture has one.
      expect(computeGroupStatistics(reports()).cronbachsAlpha).toBeNull();
    });
  });
});

describe("fixtures/editor/teacher-authored.bitflow", () => {
  it("is what the editor produces for the normal case, and it validates", () => {
    const doc = parsed("editor/teacher-authored.bitflow");
    expect(validateFlow(doc)).toEqual({ valid: true, diagnostics: [] });
    expect(doc.meta.title).toBe("Fractions: a first check");
    expect(doc.nodes.map((n) => n.type)).toEqual([
      "start-simple",
      "task-choice",
      "task-yes-no",
      "end-tries",
    ]);
  });

  it("is connected from start to end, as the editor chains it", () => {
    const doc = parsed("editor/teacher-authored.bitflow");
    expect(doc.edges).toHaveLength(3);
    const created = createAttempt(doc);
    if (!created.ok) throw new Error(created.error.message);
    expect(created.value.currentNodeId).toBe("start");
  });
});
