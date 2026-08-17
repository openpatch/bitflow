import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import { Markdown, TextAreaField, TextField } from "@bitflow/element";
import type { ReactElement } from "react";
import { messages } from "./messages";
import type { Data } from "./schema";

export const Task = ({ data }: BitTaskProps<Data>): ReactElement => (
  <div className="bitflow-stack">
    {data.title && <h1 className="bitflow-heading">{data.title}</h1>}
    <Markdown markdown={data.markdown} />
  </div>
);

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
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
    </div>
  );
};
