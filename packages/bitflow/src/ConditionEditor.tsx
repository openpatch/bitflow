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
import { messages } from "./messages";

/**
 * The teacher-facing branching editor.
 *
 * Covers the two branches a teacher actually draws — "go this way when task X
 * was answered like this", and "go this way once they have enough right" — as a
 * couple of dropdowns. The condition model underneath supports nested and/or/not
 * over any value in the attempt, but putting that in front of a teacher would be
 * a rules engine, not a lesson.
 */
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
  const t = (key: string) => translate(messages, key, locale);
  const simple = asSimpleCondition(condition);

  const tasks = doc.nodes.filter((node) => getBit(node.type)?.kind === "task");

  // Anything the dropdowns cannot express is shown read-only rather than
  // silently rewritten into something simpler.
  if (condition && !simple) {
    return (
      <div className="bitflow-field">
        <span className="bitflow-label">{t("condition")}</span>
        <pre className="bitflow-condition-advanced">
          {JSON.stringify(condition, null, 2)}
        </pre>
      </div>
    );
  }

  const states: Array<{ value: BitResultState; label: string }> = [
    { value: "correct", label: t("conditionStateCorrect") },
    { value: "wrong", label: t("conditionStateWrong") },
    { value: "unknown", label: t("conditionStateUnknown") },
    { value: "manual", label: t("conditionStateManual") },
  ];

  return (
    <div className="bitflow-stack-small bitflow-stack">
      <SelectField
        label={t("condition")}
        value={simple?.kind ?? "always"}
        options={[
          { value: "always", label: t("conditionAlways") },
          { value: "result", label: t("conditionResult") },
          { value: "count", label: t("conditionCount") },
        ]}
        onChange={(kind) => {
          if (kind === "always") {
            onChange(undefined);
            return;
          }
          if (kind === "count") {
            onChange(countCondition("gte", 1, "correct"));
            return;
          }
          // Branching on one task needs a task to point at.
          const first = tasks[0];
          if (first) onChange(resultCondition(first.id, "correct"));
        }}
      />

      {simple?.kind === "result" && (
        <>
          <SelectField
            label={t("conditionNode")}
            value={simple.nodeId}
            options={tasks.map((node) => ({
              value: node.id,
              label: summariseNode(doc, node.id, locale),
            }))}
            onChange={(nodeId) => onChange(resultCondition(nodeId, simple.state))}
          />
          <SelectField
            label={t("conditionState")}
            value={simple.state}
            options={states}
            onChange={(state) => onChange(resultCondition(simple.nodeId, state))}
          />
        </>
      )}

      {simple?.kind === "count" && (
        <>
          <SelectField
            label={t("conditionState")}
            value={simple.state}
            options={states}
            onChange={(state) =>
              onChange(countCondition(simple.op, simple.value, state))
            }
          />
          <SelectField
            label={t("conditionCompare")}
            value={simple.op}
            options={[
              { value: "gte", label: t("conditionAtLeast") },
              { value: "lte", label: t("conditionAtMost") },
              { value: "eq", label: t("conditionExactly") },
            ]}
            onChange={(op) =>
              onChange(countCondition(op, simple.value, simple.state))
            }
          />
          <Field label={t("conditionHowMany")} hint={t("conditionHowManyHint")}>
            {(props) => (
              <input
                {...props}
                type="number"
                className="bitflow-input"
                min={0}
                step={1}
                value={simple.value}
                onChange={(event) =>
                  onChange(
                    countCondition(
                      simple.op,
                      Math.max(0, Number(event.target.value) || 0),
                      simple.state,
                    ),
                  )
                }
              />
            )}
          </Field>
        </>
      )}
    </div>
  );
};

const resultCondition = (nodeId: string, state: BitResultState): Condition => ({
  type: "compare",
  left: { kind: "result", nodeId, path: "state" },
  op: "eq",
  right: state,
});

type CountOp = "gte" | "lte" | "eq";

const countCondition = (
  op: CountOp,
  value: number,
  state: BitResultState,
): Condition => ({
  type: "compare",
  left: { kind: "resultCount", state },
  op,
  right: value,
});

type SimpleCondition =
  | { kind: "result"; nodeId: string; state: BitResultState }
  | { kind: "count"; op: CountOp; value: number; state: BitResultState };

/** Recognises the shapes the dropdowns produce, and nothing else. */
const asSimpleCondition = (
  condition?: Condition,
): SimpleCondition | undefined => {
  if (condition?.type !== "compare") return undefined;

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
