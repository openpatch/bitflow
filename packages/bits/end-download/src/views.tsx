import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useState, type ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { filenameOf, payloadOf, type Data } from "./schema";

/**
 * The closing screen that hands the run back to the learner as a file.
 *
 * bitflow grades in the page and has no server, so a run that nobody exports
 * is a run that only ever existed in one tab. This is the version of that
 * export the *learner* can perform — no account, no network, works in a room
 * with no internet.
 */
export const Task = ({
  data,
  locale,
  readonly,
  attempt,
}: BitTaskProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "saved"; filename: string } | { kind: "failed" }
  >({ kind: "idle" });

  const filename = filenameOf(data);

  const save = () => {
    if (!attempt) return;
    try {
      const blob = new Blob(
        [JSON.stringify(payloadOf(attempt, data.includeAnswers), null, 2)],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      // Revoked on a later turn of the loop, not straight away: some browsers
      // have not finished reading the blob when click() returns, and revoking
      // under them produces an empty file.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState({ kind: "saved", filename });
    } catch {
      // A browser with object URLs switched off, or storage refused. Saying so
      // matters: this may be the only copy of their work there is.
      setState({ kind: "failed" });
    }
  };

  return (
    <div className="bitflow-stack">
      {data.title && <h2 className="bitflow-heading">{data.title}</h2>}
      <Markdown markdown={data.markdown} />

      {/* No attempt means the bit is being previewed on its own. Offering a
          button that cannot do anything would be worse than saying so. */}
      {attempt ? (
        <div className="bitflow-stack-small bitflow-stack">
          <div>
            <button
              type="button"
              className="bitflow-button"
              disabled={readonly}
              onClick={save}
            >
              {data.buttonLabel || t("downloadFallback")}
            </button>
          </div>
          <p className="bitflow-hint">{t("hint")}</p>
          {/* Announced rather than merely drawn: the download itself is
              invisible to a screen reader. */}
          <p className="bitflow-download-state" role="status">
            {state.kind === "saved" && t("saved", { filename: state.filename })}
            {state.kind === "failed" && t("failed")}
          </p>
        </div>
      ) : (
        <p className="bitflow-text-muted">{t("unavailable")}</p>
      )}
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  return (
    <div className="bitflow-stack">
      <TextField
        label={t("titleLabel")}
        value={data.title}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TextAreaField
        label={t("markdownLabel")}
        hint={t("markdownHint")}
        value={data.markdown}
        onChange={(markdown) => onChange({ ...data, markdown })}
      />
      <TextField
        label={t("buttonLabelLabel")}
        hint={t("buttonLabelHint")}
        value={data.buttonLabel}
        onChange={(buttonLabel) => onChange({ ...data, buttonLabel })}
      />
      <TextField
        label={t("filenameLabel")}
        hint={t("filenameHint")}
        value={data.filename}
        onChange={(filename) => onChange({ ...data, filename })}
      />
      <CheckboxField
        label={t("includeAnswersLabel")}
        hint={t("includeAnswersHint")}
        checked={data.includeAnswers}
        onChange={(includeAnswers) => onChange({ ...data, includeAnswers })}
      />
    </div>
  );
};
