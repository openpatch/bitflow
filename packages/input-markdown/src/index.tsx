import { InputBit, InputSchema as InputSchemaBase } from "@bitflow/core";
import {
  Box,
  HookFormController,
  Markdown,
  MarkdownEditor,
} from "@openpatch/patches";
import { useTranslations as useVocabTranslations } from "@vocab/react";
import { Fragment } from "react";
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

export const useInformation: InputBit<IInput>["useInformation"] = () => {
  const { t } = useVocabTranslations(translations);
  return {
    name: t("name"),
    description: t("description"),
    example: {
      description: t("description"),
      name: t("name"),
      subtype: "markdown",
      view: {
        markdown: "# Information",
      },
    },
  };
};

export const Input: InputBit<IInput>["Input"] = ({ input }) => {
  return (
    <Box px="standard">
      <Markdown markdown={input.view.markdown} />
    </Box>
  );
};

export const ViewForm: InputBit<IInput>["ViewForm"] = ({ name }) => {
  const { t } = useVocabTranslations(translations);
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
