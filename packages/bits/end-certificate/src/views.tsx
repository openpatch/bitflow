import {
  computeScore,
  translate,
  type BitFormProps,
  type BitTaskProps,
} from "@bitflow/core";
import {
  CheckboxField,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { finishedAt, nameIn, type Data } from "./schema";

/**
 * The closing sheet, made to be printed.
 *
 * Printed rather than downloaded, because a certificate is for a person to
 * keep and a JSON file is not — `end-download` is the other half of that pair.
 * Everything on it comes out of the run itself; nothing is typed twice.
 */
export const Task = ({
  data,
  locale,
  attempt,
  flow,
}: BitTaskProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const score = data.showScore && attempt ? computeScore(attempt) : undefined;
  const name = data.showName ? nameIn(flow, attempt) : undefined;
  const date = data.showDate ? finishedAt(attempt) : undefined;

  const rows: Array<{ heading: string; value: string }> = [];
  if (name) rows.push({ heading: t("nameHeading"), value: name });
  if (score && score.possible > 0) {
    rows.push({
      heading: t("scoreHeading"),
      // Partial credit produces fractions; two decimals is as fine as anyone
      // reads a score.
      value: t("score", {
        earned: Math.round(score.earned * 100) / 100,
        possible: score.possible,
      }),
    });
  }
  if (date) {
    rows.push({
      heading: t("dateHeading"),
      value: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date),
    });
  }
  if (data.issuer) rows.push({ heading: t("issuerHeading"), value: data.issuer });

  return (
    <div className="bitflow-stack">
      <article className="bitflow-certificate">
        {data.title && <h2 className="bitflow-certificate-title">{data.title}</h2>}
        <Markdown markdown={data.markdown} />

        {rows.length > 0 ? (
          <dl className="bitflow-certificate-facts">
            {rows.map((row) => (
              <div key={row.heading} className="bitflow-certificate-fact">
                <dt>{row.heading}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          // Nothing to fill in yet: an author previewing the closing text.
          <p className="bitflow-text-muted">{t("unavailable")}</p>
        )}
      </article>

      {/* Outside the certificate, and hidden when printing: a sheet with
          "Print this" printed on it is not a certificate. */}
      <div className="bitflow-certificate-actions">
        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() => window.print()}
        >
          {data.printLabel || t("printFallback")}
        </button>
      </div>
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
        label={t("issuerLabel")}
        hint={t("issuerHint")}
        value={data.issuer}
        onChange={(issuer) => onChange({ ...data, issuer })}
      />
      <CheckboxField
        label={t("showNameLabel")}
        hint={t("showNameHint")}
        checked={data.showName}
        onChange={(showName) => onChange({ ...data, showName })}
      />
      <CheckboxField
        label={t("showScoreLabel")}
        checked={data.showScore}
        onChange={(showScore) => onChange({ ...data, showScore })}
      />
      <CheckboxField
        label={t("showDateLabel")}
        checked={data.showDate}
        onChange={(showDate) => onChange({ ...data, showDate })}
      />
      <TextField
        label={t("printLabelLabel")}
        hint={t("printLabelHint")}
        value={data.printLabel}
        onChange={(printLabel) => onChange({ ...data, printLabel })}
      />
    </div>
  );
};
