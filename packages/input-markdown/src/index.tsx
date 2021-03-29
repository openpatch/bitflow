import {
  InputProps,
  InputSchema as InputSchemaBase,
  InputViewFormProps,
} from "@bitflow/base";
import {
  Box,
  HookFormController,
  Markdown,
  MarkdownEditor,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, Fragment } from "react";
import * as z from "zod";
import translations from "./locales.vocab";

export const InputSchema = InputSchemaBase.merge(
  z.object({
    subtype: z.literal("markdown"),
    view: z.object({
      markdown: z.string(),
    }),
  })
);

export type IInput = z.infer<typeof InputSchema>;

export const Input: FC<InputProps<IInput>> = ({ input }) => {
  return (
    <Box px="standard">
      <Markdown markdown={input.view.markdown} />
    </Box>
  );
};

export const ViewForm = ({ name }: InputViewFormProps) => {
  const { t } = useTranslations(translations);
  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.markdown`}
        label={t("markdown")}
        defaultValue=""
        render={({ value, onChange, onBlur }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(_, value) => onChange(value)}
            onBlur={onBlur}
          />
        )}
      />
    </Fragment>
  );
};
