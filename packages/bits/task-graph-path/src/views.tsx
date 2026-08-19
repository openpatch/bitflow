import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import type { Reason } from "./evaluate";
import { formMessages } from "./formMessages";
import { GraphView } from "./GraphView";
import { messages } from "./messages";
import {
  answerOf,
  GOALS,
  nameOf,
  needsSource,
  needsTarget,
  withAnswer,
  type Answer,
  type Data,
  type Goal,
  type GraphEdge,
  type GraphNode,
} from "./schema";

/** How the task says what it wants, which depends on what it is asking for. */
const howTo = (data: Data): string => {
  switch (data.goal) {
    case "traversal":
      return "howToTraversal";
    case "spanningTree":
      return "howToTree";
    case "cut":
      return "howToCut";
    default:
      return "howToRoute";
  }
};

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const places = {
    source: nameOf(data, data.sourceId),
    target: nameOf(data, data.targetId),
  };
  const reason = result?.detail?.reason as Reason | undefined;

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <p className="bitflow-text-muted">
        {readonly ? t("howToReadonly") : t(howTo(data), places)}
      </p>
      {/* The tie-break rule is part of the question, not a detail of the
          implementation: without it a traversal has several right orders. */}
      {data.goal === "traversal" && (
        <p className="bitflow-text-muted">
          {t(data.neighbourOrder === "label" ? "tieLabel" : "tieAuthored")}
        </p>
      )}

      <GraphView
        data={data}
        chosen={answerOf(data.goal, answer)}
        locale={locale}
        readonly={readonly}
        correctPrefix={result?.detail?.correctPrefix as number | undefined}
        onChange={(chosen) => onAnswerChange(withAnswer(data.goal, chosen))}
      />

      {reason && (
        <p
          className={
            reason === "correct"
              ? "bitflow-alert bitflow-alert-success"
              : "bitflow-alert bitflow-alert-warning"
          }
        >
          {t(reasonKey(reason), {
            ...places,
            count: data.nodes.length,
            edges: Math.max(0, data.nodes.length - 1),
          })}
        </p>
      )}
    </div>
  );
};

/** `notToTarget` → `reasonNotToTarget`. */
const reasonKey = (reason: Reason): string =>
  `reason${reason[0].toUpperCase()}${reason.slice(1)}`;

/** A fresh id that will not collide with one the author already used. */
const newId = (prefix: string, taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!taken.includes(id)) return id;
  }
};

/** The next unused letter, so a new place is named before it is thought about. */
const nextLabel = (nodes: GraphNode[]): string => {
  const taken = new Set(nodes.map((node) => node.label));
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (!taken.has(letter)) return letter;
  }
  return "";
};

/** Evenly around a circle: a readable starting layout for any small graph. */
const inCircle = (nodes: GraphNode[]): GraphNode[] =>
  nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      x: 0.5 + Math.cos(angle) * 0.38,
      y: 0.5 + Math.sin(angle) * 0.38,
    };
  });

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const setNode = (id: string, changes: Partial<GraphNode>) =>
    patch({
      nodes: data.nodes.map((node) =>
        node.id === id ? { ...node, ...changes } : node,
      ),
    });

  const setEdge = (id: string, changes: Partial<GraphEdge>) =>
    patch({
      edges: data.edges.map((edge) =>
        edge.id === id ? { ...edge, ...changes } : edge,
      ),
    });

  /** Removing a place takes its connections with it; they would join nothing. */
  const removeNode = (id: string) =>
    patch({
      nodes: data.nodes.filter((node) => node.id !== id),
      edges: data.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      ),
      sourceId: data.sourceId === id ? "" : data.sourceId,
      targetId: data.targetId === id ? "" : data.targetId,
    });

  const places = data.nodes.map((node) => ({
    value: node.id,
    label: node.label || node.id,
  }));

  const percent = (
    node: GraphNode,
    key: "x" | "y",
    label: string,
  ): ReactElement => (
    <Field label={label}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="bitflow-input"
          min={0}
          max={100}
          step={1}
          value={Math.round(node[key] * 100)}
          onChange={(event) =>
            setNode(node.id, {
              [key]: Math.min(1, Math.max(0, Number(event.target.value) / 100)),
            })
          }
        />
      )}
    </Field>
  );

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField
        label={t("goalLabel")}
        hint={t("goalHint")}
        value={data.goal}
        options={GOALS.map((goal) => ({
          value: goal as Goal,
          label: t(`goal${goal[0].toUpperCase()}${goal.slice(1)}`),
        }))}
        onChange={(goal) => patch({ goal })}
      />

      <CheckboxField
        label={t("directedLabel")}
        hint={t("directedHint")}
        checked={data.directed}
        onChange={(directed) => patch({ directed })}
      />
      {errorFor(errors, "directed") && (
        <span className="bitflow-field-error" role="alert">
          {errorFor(errors, "directed")}
        </span>
      )}
      <CheckboxField
        label={t("weightedLabel")}
        hint={t("weightedHint")}
        checked={data.weighted}
        onChange={(weighted) => patch({ weighted })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("placesLabel")}</legend>
        <span className="bitflow-hint">{t("placesHint")}</span>
        {errorFor(errors, "nodes") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "nodes")}
          </span>
        )}
        {data.nodes.length === 0 && (
          <p className="bitflow-text-muted">{t("noPlaces")}</p>
        )}

        {data.nodes.map((node, index) => (
          <Disclosure
            key={node.id}
            summary={node.label || t("unnamedPlace")}
            aside={t("position", { position: index + 1, total: data.nodes.length })}
          >
            <TextField
              label={t("placeName")}
              value={node.label}
              error={errorFor(errors, `nodes.${index}.label`)}
              onChange={(label) => setNode(node.id, { label })}
            />
            <div className="bitflow-row">
              {percent(node, "x", t("placeX"))}
              {percent(node, "y", t("placeY"))}
            </div>
            <div className="bitflow-row">
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={() => removeNode(node.id)}
              >
                {t("remove")}
              </button>
            </div>
          </Disclosure>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() =>
              patch({
                nodes: inCircle([
                  ...data.nodes,
                  {
                    id: newId("place", data.nodes.map((node) => node.id)),
                    label: nextLabel(data.nodes),
                    x: 0.5,
                    y: 0.5,
                  },
                ]),
              })
            }
          >
            {t("addPlace")}
          </button>
          <button
            type="button"
            className="bitflow-button bitflow-button-quiet"
            disabled={data.nodes.length === 0}
            onClick={() => patch({ nodes: inCircle(data.nodes) })}
          >
            {t("arrange")}
          </button>
        </div>
      </fieldset>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("connectionsLabel")}</legend>
        <span className="bitflow-hint">{t("connectionsHint")}</span>
        {errorFor(errors, "edges") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "edges")}
          </span>
        )}
        {data.edges.length === 0 && (
          <p className="bitflow-text-muted">{t("noConnections")}</p>
        )}

        {data.edges.map((edge, index) => (
          <Disclosure
            key={edge.id}
            summary={`${nameOf(data, edge.source)} → ${nameOf(data, edge.target)}`}
            aside={t("position", { position: index + 1, total: data.edges.length })}
          >
            {errorFor(errors, `edges.${index}`) && (
              <span className="bitflow-field-error" role="alert">
                {errorFor(errors, `edges.${index}`)}
              </span>
            )}
            <SelectField
              label={t("connectionFrom")}
              value={edge.source}
              options={places}
              onChange={(source) => setEdge(edge.id, { source })}
            />
            <SelectField
              label={t("connectionTo")}
              value={edge.target}
              options={places}
              onChange={(target) => setEdge(edge.id, { target })}
            />
            {data.weighted && (
              <Field label={t("connectionWeight")}>
                {(props) => (
                  <input
                    {...props}
                    type="number"
                    className="bitflow-input"
                    min={1}
                    step={1}
                    value={edge.weight}
                    onChange={(event) =>
                      setEdge(edge.id, {
                        weight: Math.max(
                          0.001,
                          Number(event.target.value) || 1,
                        ),
                      })
                    }
                  />
                )}
              </Field>
            )}
            <div className="bitflow-row">
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={() =>
                  patch({
                    edges: data.edges.filter((other) => other.id !== edge.id),
                  })
                }
              >
                {t("remove")}
              </button>
            </div>
          </Disclosure>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            disabled={data.nodes.length < 2}
            onClick={() =>
              patch({
                edges: [
                  ...data.edges,
                  {
                    id: newId("link", data.edges.map((edge) => edge.id)),
                    source: data.nodes[0].id,
                    target: data.nodes[1].id,
                    weight: 1,
                  },
                ],
              })
            }
          >
            {t("addConnection")}
          </button>
        </div>
      </fieldset>

      {needsSource(data.goal) && (
        <SelectField
          label={t("sourceLabel")}
          hint={t("sourceHint")}
          value={data.sourceId}
          options={[{ value: "", label: "—" }, ...places]}
          error={errorFor(errors, "sourceId")}
          onChange={(sourceId) => patch({ sourceId })}
        />
      )}

      {needsTarget(data.goal) && (
        <SelectField
          label={t("targetLabel")}
          hint={t("targetHint")}
          value={data.targetId}
          options={[{ value: "", label: "—" }, ...places]}
          error={errorFor(errors, "targetId")}
          onChange={(targetId) => patch({ targetId })}
        />
      )}

      {data.goal === "traversal" && (
        <>
          <SelectField
            label={t("traversalLabel")}
            value={data.traversal}
            options={[
              { value: "bfs" as const, label: t("traversalBfs") },
              { value: "dfs" as const, label: t("traversalDfs") },
            ]}
            onChange={(traversal) => patch({ traversal })}
          />
          <SelectField
            label={t("neighbourOrderLabel")}
            hint={t("neighbourOrderHint")}
            value={data.neighbourOrder}
            options={[
              { value: "label" as const, label: t("orderLabel") },
              { value: "authored" as const, label: t("orderAuthored") },
            ]}
            onChange={(neighbourOrder) => patch({ neighbourOrder })}
          />
        </>
      )}

      {data.nodes.length > 0 && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("previewLabel")}</span>
          <span className="bitflow-hint">{t("previewHint")}</span>
          <GraphView
            data={data}
            chosen={[]}
            locale={locale}
            onMoveNode={(id, x, y) => setNode(id, { x, y })}
          />
        </div>
      )}

      <Disclosure summary={t("advanced")}>
        {data.goal === "traversal" && (
          <CheckboxField
            label={t("partialCreditLabel")}
            hint={t("partialCreditHint")}
            checked={data.partialCredit}
            onChange={(partialCredit) => patch({ partialCredit })}
          />
        )}
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
