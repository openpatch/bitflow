import {
  getBit,
  translate,
  type BitflowDocument,
  type Condition,
  type Locale,
} from "@bitflow/core";
import { SelectField } from "@bitflow/element";
import type { ReactElement } from "react";
import { messages } from "./messages";

/**
 * The teacher-facing branching editor.
 *
 * Covers the case that accounts for nearly every branch a teacher draws —
 * "go this way when task X was answered like this" — as two dropdowns. The
 * condition model underneath supports nested and/or/not, but putting that in
 * front of a teacher would be a rules engine, not a lesson.
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

  // Anything the two dropdowns cannot express is shown read-only rather than
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

  return (
    <div className="bitflow-stack-small bitflow-stack">
      <SelectField
        label={t("condition")}
        value={simple ? "result" : "always"}
        options={[
          { value: "always", label: t("conditionAlways") },
          { value: "result", label: t("conditionResult") },
        ]}
        onChange={(kind) => {
          if (kind === "always") {
            onChange(undefined);
            return;
          }
          const first = tasks[0];
          if (!first) return;
          onChange(resultCondition(first.id, "correct"));
        }}
      />

      {simple && (
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
            options={[
              { value: "correct", label: translate(messages, "conditionStateCorrect", locale) },
              { value: "wrong", label: translate(messages, "conditionStateWrong", locale) },
              { value: "unknown", label: translate(messages, "conditionStateUnknown", locale) },
              { value: "manual", label: translate(messages, "conditionStateManual", locale) },
            ]}
            onChange={(state) => onChange(resultCondition(simple.nodeId, state))}
          />
        </>
      )}
    </div>
  );
};

const resultCondition = (nodeId: string, state: string): Condition => ({
  type: "compare",
  left: { kind: "result", nodeId, path: "state" },
  op: "eq",
  right: state,
});

/** Recognises the shape the two dropdowns produce, and nothing else. */
const asSimpleCondition = (
  condition?: Condition,
): { nodeId: string; state: string } | undefined => {
  if (
    condition?.type === "compare" &&
    condition.op === "eq" &&
    condition.left.kind === "result" &&
    condition.left.path === "state" &&
    typeof condition.right === "string"
  ) {
    return { nodeId: condition.left.nodeId, state: condition.right };
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
