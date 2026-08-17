import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import { Markdown, TextAreaField } from "@bitflow/element";
import type { ReactElement } from "react";
import { messages } from "./messages";
import type { Data } from "./schema";

/**
 * The Markdown goes through `@bitflow/element`'s renderer, which sanitises the
 * result. A `.bitflow` file is untrusted input, and this is the bit whose whole
 * job is to render whatever it contains.
 */
export const Task = ({ data }: BitTaskProps<Data>): ReactElement => (
  <Markdown markdown={data.markdown} />
);

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => (
  <TextAreaField
    label={translate(messages, "markdownLabel", locale)}
    hint={translate(messages, "markdownHint", locale)}
    rows={8}
    value={data.markdown}
    onChange={(markdown) => onChange({ ...data, markdown })}
  />
);
