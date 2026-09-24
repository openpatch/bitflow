import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorAt,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useEffect, useState, type ReactElement } from "react";
import type { PlacementState, Reason } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  TRAVERSAL_KINDS,
  type Answer,
  type Data,
  type Mode,
  type TraversalKind,
} from "./schema";
import {
  buildBstFromKeys,
  parseKeyList,
  parsesAsNumber,
  parseTreeText,
  treeToText,
} from "./tree";
import { TreeView } from "./TreeView";

const ORDER_KEY: Record<TraversalKind, string> = {
  preorder: "orderPreorder",
  inorder: "orderInorder",
  postorder: "orderPostorder",
  levelorder: "orderLevelorder",
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
  const detail = result?.detail as
    | { reason?: Reason; correctPrefix?: number; states?: PlacementState[] }
    | undefined;

  const howTo = readonly
    ? t("howToReadonly")
    : data.mode === "search"
      ? t("howToSearch", { key: data.searchKey })
      : data.mode === "insert"
        ? t("howToInsert")
        : t("howToTraversal", { order: t(ORDER_KEY[data.traversal]) });

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      {/* Above the diagram and before it in reading order: it says what a tap
          means before there is anything to tap. */}
      <p className="bitflow-hint">{howTo}</p>
      <TreeView
        data={data}
        answer={answer}
        locale={locale}
        readonly={readonly}
        correctPrefix={detail?.correctPrefix}
        placementStates={detail?.states}
        onChange={onAnswerChange}
      />
      {detail?.reason && detail.reason !== "correct" && (
        <p className="bitflow-text">{t(`reason_${detail.reason}`)}</p>
      )}
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  // The tree is edited as text but stored as nodes, so the text is a draft:
  // half-typed it does not parse, and the stored tree must not be thrown away
  // while it is being typed.
  const [text, setText] = useState(() => treeToText(data.tree));
  const [parseError, setParseError] = useState<string | undefined>(undefined);
  const [keys, setKeys] = useState("");
  const [insertText, setInsertText] = useState(() => data.insertKeys.join(", "));

  // A tree changed from outside (a document reloaded, the undo of a host)
  // replaces the draft, unless the draft already reads as that tree.
  useEffect(() => {
    const parsed = parseTreeText(text);
    if ("tree" in parsed && treeToText(parsed.tree) === treeToText(data.tree)) return;
    setText(treeToText(data.tree));
    setParseError(undefined);
    // `text` is ours; only an outside change to the tree should reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.tree]);

  const editText = (next: string) => {
    setText(next);
    const parsed = parseTreeText(next);
    if ("error" in parsed) {
      setParseError(t(parsed.error, parsed.vars));
      return;
    }
    setParseError(undefined);
    patch({ tree: parsed.tree });
  };

  const build = () => {
    const list = parseKeyList(keys);
    const tree = buildBstFromKeys(list, list.length > 0 && list.every(parsesAsNumber));
    setText(treeToText(tree));
    setParseError(undefined);
    patch({ tree });
  };

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField<Mode>
        label={t("modeLabel")}
        hint={t("modeHint")}
        value={data.mode}
        options={[
          { value: "traversal", label: t("modeTraversal") },
          { value: "search", label: t("modeSearch") },
          { value: "insert", label: t("modeInsert") },
        ]}
        onChange={(mode) => patch({ mode })}
      />

      {data.mode === "traversal" && (
        <SelectField<TraversalKind>
          label={t("traversalLabel")}
          value={data.traversal}
          options={TRAVERSAL_KINDS.map((kind) => ({ value: kind, label: t(ORDER_KEY[kind]) }))}
          onChange={(traversal) => patch({ traversal })}
        />
      )}

      <Field
        label={t("treeLabel")}
        hint={t("treeHint")}
        error={parseError ?? errorAt(errors, "tree.nodes") ?? errorFor(errors, "tree.root")}
      >
        {(props) => (
          <textarea
            {...props}
            className="bitflow-textarea bitflow-tree-text"
            rows={3}
            value={text}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => editText(event.target.value)}
          />
        )}
      </Field>

      {data.mode !== "traversal" && (
        <div className="bitflow-field">
          <span className="bitflow-label">{t("buildLabel")}</span>
          <div className="bitflow-row">
            <input
              type="text"
              className="bitflow-input bitflow-tree-keys"
              aria-label={t("buildLabel")}
              placeholder="8, 3, 10, 1, 6, 14"
              value={keys}
              onChange={(event) => setKeys(event.target.value)}
            />
            <button
              type="button"
              className="bitflow-button bitflow-button-secondary"
              onClick={build}
            >
              {t("buildButton")}
            </button>
          </div>
          <span className="bitflow-hint">{t("buildHint")}</span>
        </div>
      )}

      <div className="bitflow-field">
        <span className="bitflow-label">{t("previewLabel")}</span>
        <TreeView data={{ ...data, mode: "traversal" }} locale={locale} readonly diagramOnly />
      </div>

      {data.mode === "search" && (
        <TextField
          label={t("searchKeyLabel")}
          hint={t("searchKeyHint")}
          value={data.searchKey}
          error={errorFor(errors, "searchKey")}
          onChange={(searchKey) => patch({ searchKey: searchKey.trim() })}
        />
      )}

      {data.mode === "insert" && (
        <TextField
          label={t("insertKeysLabel")}
          hint={t("insertKeysHint")}
          value={insertText}
          error={errorFor(errors, "insertKeys")}
          onChange={(value) => {
            setInsertText(value);
            patch({ insertKeys: parseKeyList(value) });
          }}
        />
      )}

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("partialCreditLabel")}
          hint={t("partialCreditHint")}
          checked={data.partialCredit}
          onChange={(partialCredit) => patch({ partialCredit })}
        />
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
