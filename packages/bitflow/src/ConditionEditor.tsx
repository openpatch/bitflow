import {
  getBit,
  translate,
  type BitflowDocument,
  type BitResultState,
  type Condition,
  type Locale,
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

type Rule =
  | { kind: "result"; nodeId: string; state: BitResultState }
  | { kind: "count"; op: CountOp; value: number; state: BitResultState };

type RuleSet = { combinator: "and" | "or"; rules: Rule[] };

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

  return (
    <div className="bitflow-stack-small bitflow-stack">
      <SelectField
        label={t("conditionRuleKind")}
        value={rule.kind}
        options={[
          { value: "count", label: t("conditionCount") },
          { value: "result", label: t("conditionResult") },
        ]}
        onChange={(kind) => {
          if (kind === rule.kind) return;
          onChange(
            kind === "count"
              ? { kind: "count", op: "gte", value: 1, state: rule.state }
              : {
                  kind: "result",
                  nodeId: tasks[0]?.id ?? "",
                  state: rule.state,
                },
          );
        }}
      />

      {rule.kind === "result" ? (
        <SelectField
          label={t("conditionNode")}
          value={rule.nodeId}
          options={tasks.map((node) => ({
            value: node.id,
            label: summariseNode(doc, node.id, locale),
          }))}
          onChange={(nodeId) => onChange({ ...rule, nodeId })}
        />
      ) : (
        <>
          <SelectField
            label={t("conditionCompare")}
            value={rule.op}
            options={[
              { value: "gte", label: t("conditionAtLeast") },
              { value: "lte", label: t("conditionAtMost") },
              { value: "eq", label: t("conditionExactly") },
            ]}
            onChange={(op) => onChange({ ...rule, op })}
          />
          <Field label={t("conditionHowMany")} hint={t("conditionHowManyHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={0}
                step={1}
                value={rule.value}
                onChange={(event) =>
                  onChange({
                    ...rule,
                    value: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            )}
          </Field>
        </>
      )}

      <SelectField
        label={t("conditionState")}
        value={rule.state}
        options={states}
        onChange={(state) => onChange({ ...rule, state })}
      />
    </div>
  );
};

// --- the model, in both directions ------------------------------------------

const toCompare = (rule: Rule): Condition =>
  rule.kind === "result"
    ? {
        type: "compare",
        left: { kind: "result", nodeId: rule.nodeId, path: "state" },
        op: "eq",
        right: rule.state,
      }
    : {
        type: "compare",
        left: { kind: "resultCount", state: rule.state },
        op: rule.op,
        right: rule.value,
      };

/** One rule stays a bare comparison, so simple documents stay simple. */
const toCondition = (set: RuleSet): Condition =>
  set.rules.length === 1
    ? toCompare(set.rules[0])
    : { type: set.combinator, conditions: set.rules.map(toCompare) };

const asRule = (condition: Condition): Rule | undefined => {
  if (condition.type !== "compare") return undefined;

  if (
    condition.op === "eq" &&
    condition.left.kind === "result" &&
    condition.left.path === "state" &&
    typeof condition.right === "string"
  ) {
    return {
      kind: "result",
      nodeId: condition.left.nodeId,
      state: condition.right as BitResultState,
    };
  }

  if (
    condition.left.kind === "resultCount" &&
    (condition.op === "gte" || condition.op === "lte" || condition.op === "eq") &&
    typeof condition.right === "number"
  ) {
    return {
      kind: "count",
      op: condition.op,
      value: condition.right,
      state: condition.left.state,
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
