import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import type { ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import { outlineOf, type Data } from "./schema";

export const Task = ({ data, flow, locale }: BitTaskProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  // Absent when the bit is rendered on its own, as in an author's preview:
  // there is no assessment to describe, so there is nothing to promise.
  const outline = data.showOutline ? outlineOf(flow) : undefined;

  return (
    <div className="bitflow-stack">
      {data.title && <h1 className="bitflow-heading">{data.title}</h1>}
      <Markdown markdown={data.markdown} />

      {outline && (
        <section className="bitflow-outline">
          <h2 className="bitflow-label">{t("outlineHeading")}</h2>
          <ul className="bitflow-outline-list">
            <li>{t("outlineQuestions", { count: outline.questions })}</li>
            <li>
              {outline.timeLimit
                ? // Rounded up: a limit of 90 seconds is "2 minutes" to plan
                  // around, never "1" — which would be a promise of less time
                  // than they actually have.
                  t("outlineMinutes", {
                    minutes: Math.ceil(outline.timeLimit / 60),
                  })
                : t("outlineNoLimit")}
            </li>
            <li>{outline.canGoBack ? t("outlineBack") : t("outlineNoBack")}</li>
          </ul>
        </section>
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
        hint={t("titleHint")}
        value={data.title}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TextAreaField
        label={t("markdownLabel")}
        hint={t("markdownHint")}
        value={data.markdown}
        onChange={(markdown) => onChange({ ...data, markdown })}
      />
      <CheckboxField
        label={t("showOutlineLabel")}
        hint={t("showOutlineHint")}
        checked={data.showOutline}
        onChange={(showOutline) => onChange({ ...data, showOutline })}
      />
    </div>
  );
};
