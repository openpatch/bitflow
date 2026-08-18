import { scoreOf, type BitResultState } from "@bitflow/core";
import type { AttemptReport } from "./report";
import {
  cronbachsAlpha,
  pearsonsCorrelation,
  rank,
  summary,
  type Summary,
} from "./stats";

/**
 * Cohort statistics over an array of raw per-learner reports.
 *
 * Every number here is computed in the browser from the array it is given.
 * Where that array came from — files picked off disk, pasted JSON, a service —
 * is not this package's business.
 */

export type ItemStatistics = {
  nodeId: string;
  bitType: string;
  /** How many learners reached this item at all. */
  answered: number;
  counts: Record<BitResultState, number>;
  /**
   * Mean score, 0–1. In classical test theory this is the item's *difficulty*
   * (confusingly: a high value means an easy item).
   */
  difficulty: number;
  /**
   * Correlation between doing well on this item and doing well overall.
   * Near zero or negative means the item is not measuring what the rest of the
   * assessment measures. `null` when there is not enough variation to tell.
   */
  discrimination: number | null;
  /** Mean attempts among learners who reached it. */
  averageTries: number;
  /** Mean time on the item, when the reports recorded any. */
  averageElapsedMs: number | null;
};

export type LearnerScore = {
  attemptId: string;
  label: string;
  earned: number;
  possible: number;
  /** 0–1, or `null` when the learner had nothing scorable. */
  ratio: number | null;
  rank: number;
};

export type GroupStatistics = {
  learners: number;
  items: ItemStatistics[];
  scores: LearnerScore[];
  /** Distribution of the earned scores. `null` for fewer than two learners. */
  summary: Summary | null;
  /**
   * Internal consistency across items. `null` when there are too few items or
   * learners, or when nobody's score varied — saying "0.0 reliability" in
   * those cases would be a claim the data cannot support.
   *
   * Computed over `reliability.common` items only. See there.
   */
  cronbachsAlpha: number | null;
  /**
   * What `cronbachsAlpha` was actually measured on.
   *
   * Alpha assumes every learner answered every item. Branching exists so that
   * they do not, and a branched cohort has no such rectangle — so alpha is
   * taken over the items *everyone* reached, and these two numbers say how
   * much of the assessment that was. When they differ, alpha describes the
   * common core rather than the assessment, and the report says so.
   */
  reliability: {
    /** Items every learner has a gradable score for. */
    common: number;
    /** Items anyone reached. */
    total: number;
  };
};

const EMPTY_COUNTS = (): Record<BitResultState, number> => ({
  correct: 0,
  wrong: 0,
  unknown: 0,
});

/** Every item any learner met, in the order they first appear. */
const itemOrder = (reports: AttemptReport[]): Array<{ nodeId: string; bitType: string }> => {
  const items: Array<{ nodeId: string; bitType: string }> = [];
  for (const report of reports) {
    for (const nodeReport of report.nodeReports) {
      if (!items.some((item) => item.nodeId === nodeReport.nodeId)) {
        items.push({ nodeId: nodeReport.nodeId, bitType: nodeReport.bitType });
      }
    }
  }
  return items;
};

const ratioOf = (report: AttemptReport, nodeId: string): number | null => {
  const nodeReport = report.nodeReports.find((n) => n.nodeId === nodeId);
  if (!nodeReport?.result) return null;
  const score = scoreOf(nodeReport.result);
  return score.possible === 0 ? null : score.earned / score.possible;
};

export const computeGroupStatistics = (
  reports: AttemptReport[],
): GroupStatistics => {
  const items = itemOrder(reports);

  const totals = reports.map((report) => report.score?.earned ?? 0);
  const ranks = rank(totals);

  const scores: LearnerScore[] = reports.map((report, index) => {
    const earned = report.score?.earned ?? 0;
    const possible = report.score?.possible ?? 0;
    return {
      attemptId: report.attemptId,
      label: report.subject?.label ?? report.subject?.id ?? report.attemptId,
      earned,
      possible,
      ratio: possible === 0 ? null : earned / possible,
      rank: ranks[index],
    };
  });

  const itemStatistics = items.map(({ nodeId, bitType }) =>
    describeItem(reports, totals, nodeId, bitType),
  );

  const common = commonItems(reports, items);

  return {
    learners: reports.length,
    items: itemStatistics,
    scores,
    summary: reports.length >= 2 ? summary(totals) : null,
    cronbachsAlpha: cronbachsAlpha(scoreMatrix(reports, common)),
    reliability: { common: common.length, total: items.length },
  };
};

const describeItem = (
  reports: AttemptReport[],
  totals: number[],
  nodeId: string,
  bitType: string,
): ItemStatistics => {
  const counts = EMPTY_COUNTS();
  const ratios: number[] = [];
  const ratioTotals: number[] = [];
  const tries: number[] = [];
  const elapsed: number[] = [];
  let answered = 0;

  reports.forEach((report, index) => {
    const nodeReport = report.nodeReports.find((n) => n.nodeId === nodeId);
    if (!nodeReport) return;

    answered += 1;
    tries.push(nodeReport.tries);
    if (nodeReport.elapsedMs !== undefined) elapsed.push(nodeReport.elapsedMs);
    if (nodeReport.result) counts[nodeReport.result.state] += 1;

    const ratio = ratioOf(report, nodeId);
    if (ratio !== null) {
      ratios.push(ratio);
      // Paired with the learner's own total, so discrimination compares like
      // with like even when learners saw different numbers of items.
      ratioTotals.push(totals[index]);
    }
  });

  return {
    nodeId,
    bitType,
    answered,
    counts,
    difficulty: ratios.length === 0 ? 0 : mean(ratios),
    discrimination: discriminationOf(ratios, ratioTotals),
    averageTries: tries.length === 0 ? 0 : mean(tries),
    averageElapsedMs: elapsed.length === 0 ? null : mean(elapsed),
  };
};

/**
 * Point-biserial-style correlation of item score against total score.
 *
 * `null` unless there are at least three learners and both series actually
 * vary — with everyone scoring the same, the correlation is undefined rather
 * than zero, and reporting zero would read as "this item discriminates badly".
 */
const discriminationOf = (
  ratios: number[],
  totals: number[],
): number | null => {
  if (ratios.length < 3) return null;
  if (new Set(ratios).size < 2 || new Set(totals).size < 2) return null;
  const value = pearsonsCorrelation(ratios, totals);
  return Number.isFinite(value) ? value : null;
};

/**
 * The items every learner has a gradable score for.
 *
 * Alpha used to run over all of them, scoring an unreached item 0. That is
 * wrong twice over: on a branching flow "never saw it" and "got it wrong" are
 * different things, and filling the gap with the worst possible score
 * manufactures agreement between items — inflating the very number it is
 * meant to measure. Restricting to the common core is the honest version;
 * when the core is too small there is simply no alpha to report.
 */
const commonItems = <T extends { nodeId: string }>(
  reports: AttemptReport[],
  items: T[],
): T[] =>
  items.filter((item) =>
    reports.every((report) => ratioOf(report, item.nodeId) !== null),
  );

/** `items × learners`, for Cronbach's alpha. Every cell is a real score. */
const scoreMatrix = (
  reports: AttemptReport[],
  items: Array<{ nodeId: string }>,
): number[][] =>
  items.map((item) =>
    reports.map((report) => ratioOf(report, item.nodeId) ?? 0),
  );

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
