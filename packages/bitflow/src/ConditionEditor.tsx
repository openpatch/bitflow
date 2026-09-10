import {
  getBit,
  translate,
  type BitflowDocument,
  type BitResultState,
  type Condition,
  type Locale,
  type Scope,
} from "@bitflow/core";
import { Field, SelectField } from "@bitflow/element";
import type { ReactElement } from "react";
import { editorMessages as messages } from "./editorMessages";

/**
 * The teacher-facing branching editor.
 *
 * A connection is followed always, or when a list of rules holds — "at least
 * eight correct, but question 1 wrong" being two rules, not one. The model
 * underneath nests arbitrarily; this exposes the one shape teachers actually
 * write, a flat list joined by all-of or any-of, and shows anything more
 * involved read-only rather than mangling it.
 */

type CountOp = "gte" | "lte" | "eq";
/** A threshold on something continuous only reads two ways worth offering. */
type ThresholdOp = "gte" | "lte";

type Rule =
  | { kind: "result"; nodeId: string; state: BitResultState }
  /**
   * A yes/no answer, for a step that asks one — agreeing to take part, a
   * true/false question. Only the bare boolean shape: an answer buried at a dot
   * path is a rule the form has no jargon-free way to build, so it stays in the
   * file and is shown read-only.
   */
  | { kind: "answer"; nodeId: string; value: boolean }
  | {
      kind: "count";
      op: CountOp;
      value: number;
      state: BitResultState;
      /** Absent counts the whole assessment. */
      scope?: Scope;
    }
  | { kind: "confidence"; nodeId: string; op: ThresholdOp; value: number }
  /**
   * How much of the marks they have. `ratio` is the one worth reaching for —
   * "did they pass this section" is a share, not a number of points, and it
   * stays right when the section gains a question.
   */
  | {
      kind: "score";
      measure: "ratio" | "points";
      op: ThresholdOp;
      value: number;
      scope?: Scope;
    }
  | { kind: "visits"; nodeId: string; op: CountOp; value: number }
  | {
      kind: "time";
      of: "spent" | "remaining";
      op: ThresholdOp;
      seconds: number;
    };

type RuleSet = { combinator: "and" | "or"; rules: Rule[] };

/** The five points the learner is actually offered, as the fractions stored. */
const SURE_LEVELS = [0.2, 0.4, 0.6, 0.8, 1] as const;

export const ConditionEditor = ({
  doc,
  condition,
  locale,
  onChange,
}: {
  doc: BitflowDocument;
  condition?: Condition;
  locale: Locale;
  onChange: (condition: Condition | undefined) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const parsed = asRuleSet(condition);
  const tasks = doc.nodes.filter((node) => getBit(node.type)?.kind === "task");

  if (condition && !parsed) {
    return (
      <div className="bitflow-field">
        <span className="bitflow-label">{t("condition")}</span>
        <p className="bitflow-hint">{t("conditionAdvanced")}</p>
        <pre className="bitflow-condition-advanced">
          {JSON.stringify(condition, null, 2)}
        </pre>
      </div>
    );
  }

  const publish = (next: RuleSet) => onChange(toCondition(next));

  const states: Array<{ value: BitResultState; label: string }> = [
    { value: "correct", label: t("conditionStateCorrect") },
    { value: "wrong", label: t("conditionStateWrong") },
    { value: "unknown", label: t("conditionStateUnknown") },
  ];

  // Counting needs no task to point at, so it is always a safe starting rule.
  const defaultRule = (): Rule => ({
    kind: "count",
    op: "gte",
    value: 1,
    state: "correct",
  });

  const replaceRule = (index: number, rule: Rule) => {
    if (!parsed) return;
    publish({
      ...parsed,
      rules: parsed.rules.map((existing, i) => (i === index ? rule : existing)),
    });
  };

  return (
    <div className="bitflow-stack-small bitflow-stack">
      <SelectField
        label={t("condition")}
        value={parsed ? "rules" : "always"}
        options={[
          { value: "always", label: t("conditionAlways") },
          { value: "rules", label: t("conditionRules") },
        ]}
        onChange={(kind) => {
          if (kind === "always") {
            onChange(undefined);
            return;
          }
          publish({ combinator: "and", rules: [defaultRule()] });
        }}
      />

      {parsed && (
        <>
          {/* Only meaningful once there is something to combine. */}
          {parsed.rules.length > 1 && (
            <SelectField
              label={t("conditionCombinator")}
              value={parsed.combinator}
              options={[
                { value: "and", label: t("conditionAll") },
                { value: "or", label: t("conditionAny") },
              ]}
              onChange={(combinator) => publish({ ...parsed, combinator })}
            />
          )}

          <ol className="bitflow-rules">
            {parsed.rules.map((rule, index) => (
              <li key={index} className="bitflow-rule">
                <RuleFields
                  rule={rule}
                  tasks={tasks}
                  doc={doc}
                  states={states}
                  locale={locale}
                  onChange={(next) => replaceRule(index, next)}
                />
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  // The last rule cannot go: a rule set with nothing in it is
                  // either always true or never true, and "Always" already says
                  // the first of those.
                  disabled={parsed.rules.length <= 1}
                  onClick={() =>
                    publish({
                      ...parsed,
                      rules: parsed.rules.filter((_, i) => i !== index),
                    })
                  }
                >
                  {t("conditionRemoveRule")}
                </button>
              </li>
            ))}
          </ol>

          <div className="bitflow-row">
            <button
              type="button"
              className="bitflow-button bitflow-button-secondary"
              onClick={() =>
                publish({ ...parsed, rules: [...parsed.rules, defaultRule()] })
              }
            >
              {t("conditionAddRule")}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/** A whole number the author types, never below zero. */
const NumberField = ({
  label,
  hint,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}): ReactElement => (
  <Field label={label} hint={hint}>
    {(props) => (
      <input
        {...props}
        type="number"
        className="bitflow-input"
        min={min}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(Math.max(min, Math.round(Number(event.target.value) || 0)))
        }
      />
    )}
  </Field>
);

const RuleFields = ({
  rule,
  tasks,
  doc,
  states,
  locale,
  onChange,
}: {
  rule: Rule;
  tasks: BitflowDocument["nodes"];
  doc: BitflowDocument;
  states: Array<{ value: BitResultState; label: string }>;
  locale: Locale;
  onChange: (rule: Rule) => void;
}): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const firstTask = tasks[0]?.id ?? "";
  const nodeOptions = (nodes: BitflowDocument["nodes"]) =>
    nodes.map((node) => ({
      value: node.id,
      label: summariseNode(doc, node.id, locale),
    }));

  /**
   * Switching what a rule is about keeps whatever the new shape can use and
   * fills the rest in. Anything else throws away a choice the author has
   * already made just because they changed their mind about the other half.
   */
  const switchKind = (kind: Rule["kind"]) => {
    if (kind === rule.kind) return;
    const nodeId = "nodeId" in rule ? rule.nodeId : firstTask;
    const state = "state" in rule ? rule.state : "correct";
    switch (kind) {
      case "count":
        return onChange({ kind: "count", op: "gte", value: 1, state });
      case "result":
        return onChange({ kind: "result", nodeId, state });
      case "answer":
        return onChange({ kind: "answer", nodeId, value: true });
      case "confidence":
        return onChange({ kind: "confidence", nodeId, op: "gte", value: 0.8 });
      case "score":
        return onChange({
          kind: "score",
          measure: "ratio",
          op: "gte",
          value: 0.8,
          scope: "scope" in rule ? rule.scope : undefined,
        });
      case "visits":
        return onChange({ kind: "visits", nodeId, op: "gte", value: 2 });
      case "time":
        return onChange({
          kind: "time",
          of: "remaining",
          op: "lte",
          seconds: 60,
        });
    }
  };

  const thresholdOps = [
    { value: "gte" as const, label: t("conditionAtLeast") },
    { value: "lte" as const, label: t("conditionAtMost") },
  ];
  const countOps = [...thresholdOps, { value: "eq" as const, label: t("conditionExactly") }];

  return (
    <div className="bitflow-stack-small bitflow-stack">
      <SelectField
        label={t("conditionRuleKind")}
        value={rule.kind}
        options={[
          { value: "count", label: t("conditionCount") },
          { value: "result", label: t("conditionResult") },
          { value: "answer", label: t("conditionAnswer") },
          { value: "score", label: t("conditionScore") },
          { value: "confidence", label: t("conditionConfidence") },
          { value: "visits", label: t("conditionVisits") },
          { value: "time", label: t("conditionTime") },
        ]}
        onChange={switchKind}
      />

      {rule.kind === "result" && (
        <SelectField
          label={t("conditionNode")}
          value={rule.nodeId}
          options={nodeOptions(tasks)}
          onChange={(nodeId) => onChange({ ...rule, nodeId })}
        />
      )}

      {rule.kind === "answer" && (
        <>
          {/* Every step, not only tasks: the step that asks whether they agree
              to take part is a start, and it is the main reason this exists. */}
          <SelectField
            label={t("conditionStep")}
            value={rule.nodeId}
            options={nodeOptions(doc.nodes)}
            onChange={(nodeId) => onChange({ ...rule, nodeId })}
          />
          <SelectField
            label={t("conditionAnswerIs")}
            value={rule.value ? "yes" : "no"}
            options={[
              { value: "yes", label: t("conditionAnswerYes") },
              { value: "no", label: t("conditionAnswerNo") },
            ]}
            onChange={(value) => onChange({ ...rule, value: value === "yes" })}
          />
        </>
      )}

      {rule.kind === "count" && (
        <>
          <SelectField
            label={t("conditionCompare")}
            value={rule.op}
            options={countOps}
            onChange={(op) => onChange({ ...rule, op })}
          />
          <NumberField
            label={t("conditionHowMany")}
            hint={t("conditionHowManyHint")}
            value={rule.value}
            onChange={(value) => onChange({ ...rule, value })}
          />
          <ScopeFields
            scope={rule.scope}
            doc={doc}
            locale={locale}
            onChange={(scope) => onChange({ ...rule, scope })}
          />
        </>
      )}

      {rule.kind === "score" && (
        <>
          <SelectField
            label={t("conditionScoreMeasure")}
            value={rule.measure}
            options={[
              { value: "ratio", label: t("conditionScoreRatio") },
              { value: "points", label: t("conditionScorePoints") },
            ]}
            onChange={(measure) =>
              onChange({
                ...rule,
                measure,
                // A share and a count of points are not the same number, so
                // switching carries no value across.
                value: measure === "ratio" ? 0.8 : 5,
              })
            }
          />
          <SelectField
            label={t("conditionCompare")}
            value={rule.op}
            options={thresholdOps}
            onChange={(op) => onChange({ ...rule, op })}
          />
          {rule.measure === "ratio" ? (
            // Percent in the form, a fraction in the file: nobody writing
            // "four fifths of the marks" thinks in 0.8.
            <NumberField
              label={t("conditionScorePercent")}
              value={Math.round(rule.value * 100)}
              onChange={(percent) =>
                onChange({ ...rule, value: Math.min(100, percent) / 100 })
              }
            />
          ) : (
            <NumberField
              label={t("conditionScorePointsValue")}
              value={rule.value}
              onChange={(value) => onChange({ ...rule, value })}
            />
          )}
          <ScopeFields
            scope={rule.scope}
            doc={doc}
            locale={locale}
            onChange={(scope) => onChange({ ...rule, scope })}
          />
        </>
      )}

      {rule.kind === "confidence" && (
        <>
          <SelectField
            label={t("conditionNode")}
            value={rule.nodeId}
            options={nodeOptions(tasks)}
            onChange={(nodeId) => onChange({ ...rule, nodeId })}
          />
          <SelectField
            label={t("conditionCompare")}
            value={rule.op}
            options={thresholdOps}
            onChange={(op) => onChange({ ...rule, op })}
          />
          {/* The five points the learner is offered, not the fraction they are
              stored as: nobody writing a branch thinks in 0.8. */}
          <SelectField
            label={t("conditionHowSure")}
            value={String(closestLevel(rule.value))}
            options={SURE_LEVELS.map((level, index) => ({
              value: String(level),
              label: t(`conditionSure${index + 1}`),
            }))}
            onChange={(value) => onChange({ ...rule, value: Number(value) })}
          />
        </>
      )}

      {rule.kind === "visits" && (
        <>
          <SelectField
            label={t("conditionStep")}
            value={rule.nodeId}
            options={nodeOptions(doc.nodes)}
            onChange={(nodeId) => onChange({ ...rule, nodeId })}
          />
          <SelectField
            label={t("conditionCompare")}
            value={rule.op}
            options={countOps}
            onChange={(op) => onChange({ ...rule, op })}
          />
          <NumberField
            label={t("conditionHowOften")}
            value={rule.value}
            min={1}
            onChange={(value) => onChange({ ...rule, value })}
          />
        </>
      )}

      {rule.kind === "time" && (
        <>
          <SelectField
            label={t("conditionTimeOf")}
            value={rule.of}
            options={[
              { value: "remaining", label: t("conditionTimeRemaining") },
              { value: "spent", label: t("conditionTimeSpent") },
            ]}
            onChange={(of) => onChange({ ...rule, of })}
          />
          <SelectField
            label={t("conditionCompare")}
            value={rule.op}
            options={thresholdOps}
            onChange={(op) => onChange({ ...rule, op })}
          />
          <NumberField
            label={t("conditionSeconds")}
            value={rule.seconds}
            onChange={(seconds) => onChange({ ...rule, seconds })}
          />
        </>
      )}

      {(rule.kind === "result" || rule.kind === "count") && (
        <SelectField
          label={t("conditionState")}
          value={rule.state}
          options={states}
          onChange={(state) => onChange({ ...rule, state })}
        />
      )}
    </div>
  );
};

/** What a count is taken over: everything, one section, or the last few. */
const ScopeFields = ({
  scope,
  doc,
  locale,
  onChange,
}: {
  scope: Scope | undefined;
  doc: BitflowDocument;
  locale: Locale;
  onChange: (scope: Scope | undefined) => void;
}): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const { sections } = doc.meta;

  return (
    <>
      <SelectField
        label={t("conditionScope")}
        value={scope?.kind === "section" || scope?.kind === "last" ? scope.kind : "all"}
        options={[
          { value: "all", label: t("conditionScopeAll") },
          // Offered only when there is a section to point at; a picker with
          // nothing in it would store a scope that counts nothing.
          ...(sections.length > 0
            ? [{ value: "section", label: t("conditionScopeSection") }]
            : []),
          { value: "last", label: t("conditionScopeLast") },
        ]}
        onChange={(kind) => {
          if (kind === "section") {
            onChange({ kind: "section", id: sections[0]?.id ?? "" });
          } else if (kind === "last") {
            onChange({ kind: "last", count: 3 });
          } else {
            onChange(undefined);
          }
        }}
      />

      {scope?.kind === "section" && (
        <SelectField
          label={t("conditionScopeSectionPick")}
          value={scope.id}
          options={sections.map((section) => ({
            value: section.id,
            label: section.label || section.id,
          }))}
          onChange={(id) => onChange({ kind: "section", id })}
        />
      )}

      {scope?.kind === "last" && (
        <NumberField
          label={t("conditionScopeLastCount")}
          value={scope.count}
          min={1}
          onChange={(count) => onChange({ kind: "last", count })}
        />
      )}
    </>
  );
};

/** The stored fraction snapped to the nearest point on the learner's scale. */
const closestLevel = (value: number): number =>
  SURE_LEVELS.reduce((best, level) =>
    Math.abs(level - value) < Math.abs(best - value) ? level : best,
  );

// --- the model, in both directions ------------------------------------------

const toCompare = (rule: Rule): Condition => {
  switch (rule.kind) {
    case "result":
      return {
        type: "compare",
        left: { kind: "result", nodeId: rule.nodeId, path: "state" },
        op: "eq",
        right: rule.state,
      };
    case "count":
      return {
        type: "compare",
        // The scope is left off entirely when it is the whole assessment, so a
        // simple document stays simple to read.
        left: rule.scope
          ? { kind: "resultCount", state: rule.state, scope: rule.scope }
          : { kind: "resultCount", state: rule.state },
        op: rule.op,
        right: rule.value,
      };
    case "answer":
      return {
        type: "compare",
        left: { kind: "answer", nodeId: rule.nodeId },
        op: "eq",
        right: rule.value,
      };
    case "confidence":
      return {
        type: "compare",
        left: { kind: "confidence", nodeId: rule.nodeId },
        op: rule.op,
        right: rule.value,
      };
    case "score": {
      const kind = rule.measure === "ratio" ? "scoreRatio" : "score";
      return {
        type: "compare",
        // The scope is left off entirely when it is the whole assessment, so a
        // simple document stays simple to read.
        left: rule.scope ? { kind, scope: rule.scope } : { kind },
        op: rule.op,
        right: rule.value,
      };
    }
    case "visits":
      return {
        type: "compare",
        left: { kind: "visits", nodeId: rule.nodeId },
        op: rule.op,
        right: rule.value,
      };
    case "time":
      return {
        type: "compare",
        left:
          rule.of === "remaining"
            ? { kind: "timeRemaining" }
            : { kind: "timeSpent" },
        op: rule.op,
        right: rule.seconds,
      };
  }
};

/** One rule stays a bare comparison, so simple documents stay simple. */
const toCondition = (set: RuleSet): Condition =>
  set.rules.length === 1
    ? toCompare(set.rules[0])
    : { type: set.combinator, conditions: set.rules.map(toCompare) };

const isCountOp = (op: string): op is CountOp =>
  op === "gte" || op === "lte" || op === "eq";

const isThresholdOp = (op: string): op is ThresholdOp =>
  op === "gte" || op === "lte";

const asRule = (condition: Condition): Rule | undefined => {
  if (condition.type !== "compare") return undefined;
  const { left, op, right } = condition;

  if (
    op === "eq" &&
    left.kind === "result" &&
    left.path === "state" &&
    typeof right === "string"
  ) {
    return {
      kind: "result",
      nodeId: left.nodeId,
      state: right as BitResultState,
    };
  }

  if (
    left.kind === "answer" &&
    left.path === undefined &&
    op === "eq" &&
    typeof right === "boolean"
  ) {
    return { kind: "answer", nodeId: left.nodeId, value: right };
  }

  if (left.kind === "resultCount" && isCountOp(op) && typeof right === "number") {
    return {
      kind: "count",
      op,
      value: right,
      state: left.state,
      scope: left.scope,
    };
  }

  if (
    left.kind === "confidence" &&
    isThresholdOp(op) &&
    typeof right === "number"
  ) {
    return { kind: "confidence", nodeId: left.nodeId, op, value: right };
  }

  if (
    (left.kind === "scoreRatio" || left.kind === "score") &&
    isThresholdOp(op) &&
    typeof right === "number"
  ) {
    return {
      kind: "score",
      measure: left.kind === "scoreRatio" ? "ratio" : "points",
      op,
      value: right,
      scope: left.scope,
    };
  }

  if (left.kind === "visits" && isCountOp(op) && typeof right === "number") {
    return { kind: "visits", nodeId: left.nodeId, op, value: right };
  }

  if (
    (left.kind === "timeRemaining" || left.kind === "timeSpent") &&
    isThresholdOp(op) &&
    typeof right === "number"
  ) {
    // Only the whole-attempt clock: a per-step time rule is written in the
    // file, and the form shows it read-only rather than losing which step.
    if (left.kind === "timeSpent" && left.nodeId !== undefined) return undefined;
    return {
      kind: "time",
      of: left.kind === "timeRemaining" ? "remaining" : "spent",
      op,
      seconds: right,
    };
  }

  return undefined;
};

/**
 * Recognises the shapes this editor produces, plus a bare comparison, which is
 * what a one-rule set is stored as.
 */
const asRuleSet = (condition?: Condition): RuleSet | undefined => {
  if (!condition) return undefined;

  if (condition.type === "and" || condition.type === "or") {
    const rules = condition.conditions.map(asRule);
    if (rules.length === 0 || rules.some((rule) => !rule)) return undefined;
    return { combinator: condition.type, rules: rules as Rule[] };
  }

  const rule = asRule(condition);
  return rule ? { combinator: "and", rules: [rule] } : undefined;
};

/**
 * A short phrase for what a connection's rule says, to draw on the canvas.
 *
 * The canvas used to mark every conditional edge with a bare "?" — which says
 * a rule is there and nothing about which, so a flow with four branches out of
 * one step showed four identical question marks. An author had no way to fix
 * that either: `label` could only be written by hand in the file.
 *
 * Terse on purpose. It sits on an edge between two boxes, so it has room for a
 * few words, and an author who wants a sentence can still write their own
 * label — which wins over this.
 */
export const summariseCondition = (
  doc: BitflowDocument,
  condition: Condition | undefined,
  locale: Locale,
): string | undefined => {
  if (!condition) return undefined;
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const parsed = asRuleSet(condition);
  // A rule the form cannot show cannot be summarised either. Saying "a rule you
  // cannot see from here" is still better than "?".
  if (!parsed) return t("edgeSummaryCustom");

  const joined = parsed.rules
    .map((rule) => summariseRule(doc, rule, locale))
    .join(t(parsed.combinator === "and" ? "edgeSummaryAnd" : "edgeSummaryOr"));

  // Two boxes and a line between them is not much room. A long rule set is cut
  // rather than allowed to cover the canvas; clicking it still shows the whole
  // thing.
  return joined.length > 40 ? `${joined.slice(0, 39)}…` : joined;
};

/** `≥`, `≤` and `=` read the same in every locale this ships in. */
const OP_SYMBOL: Record<string, string> = { gte: "≥", lte: "≤", eq: "=" };

const summariseRule = (
  doc: BitflowDocument,
  rule: Rule,
  locale: Locale,
): string => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const state = (value: BitResultState) =>
    t(
      value === "correct"
        ? "edgeStateCorrect"
        : value === "wrong"
          ? "edgeStateWrong"
          : "edgeStateUnknown",
    );

  switch (rule.kind) {
    case "result":
      return state(rule.state);
    case "answer":
      return t(rule.value ? "edgeSummaryAnswerYes" : "edgeSummaryAnswerNo");
    case "count":
      return (
        `${OP_SYMBOL[rule.op]} ${rule.value} ${state(rule.state)}` +
        summariseScope(doc, rule.scope, locale)
      );
    case "score":
      return (
        (rule.measure === "ratio"
          ? t("edgeSummaryPercent", {
              op: OP_SYMBOL[rule.op],
              percent: Math.round(rule.value * 100),
            })
          : t("edgeSummaryPoints", {
              op: OP_SYMBOL[rule.op],
              points: rule.value,
            })) + summariseScope(doc, rule.scope, locale)
      );
    case "confidence":
      // Shown as the point on the scale the learner was offered, because that
      // is what the form shows and what the author chose.
      return t("edgeSummaryConfidence", {
        op: OP_SYMBOL[rule.op],
        level: Math.round(closestLevel(rule.value) * SURE_LEVELS.length),
      });
    case "visits":
      return t("edgeSummaryVisits", {
        op: OP_SYMBOL[rule.op],
        count: rule.value,
      });
    case "time":
      return t(
        rule.of === "remaining" ? "edgeSummaryTimeLeft" : "edgeSummaryTimeSpent",
        { op: OP_SYMBOL[rule.op], seconds: rule.seconds },
      );
  }
};

const summariseScope = (
  doc: BitflowDocument,
  scope: Scope | undefined,
  locale: Locale,
): string => {
  if (!scope) return "";
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  if (scope.kind === "last") {
    return ` ${t("edgeSummaryOfLast", { count: scope.count })}`;
  }
  if (scope.kind === "section") {
    const section = doc.meta.sections.find((each) => each.id === scope.id);
    return ` ${t("edgeSummaryInSection", { section: section?.label || scope.id })}`;
  }
  // A hand-picked set has no name worth fitting on an edge.
  return ` ${t("edgeSummaryOfChosen")}`;
};

const summariseNode = (
  doc: BitflowDocument,
  nodeId: string,
  locale: Locale,
): string => {
  const node = doc.nodes.find((n) => n.id === nodeId);
  if (!node) return nodeId;
  const name = getBit(node.type)?.info(locale).name ?? node.type;
  const text = Object.values(node.data).find(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  );
  return text ? `${name}: ${text.slice(0, 40)}` : name;
};
