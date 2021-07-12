import { StartBit, StartSchema as StartSchemaBase } from "@bitflow/core";
import {
  Box,
  Heading,
  HookFormController,
  Input,
  Markdown,
  MarkdownEditor,
} from "@openpatch/patches";
import { useTranslations as useVocabTranslations } from "@vocab/react";
import { Fragment } from "react";
import { z } from "zod";
import translations from "./locales.vocab";

export const StartSchema = StartSchemaBase.merge(
  z.object({
    subtype: z.literal("simple"),
    view: z.object({
      title: z.string(),
      markdown: z.string(),
    }),
  })
);

export type IStart = z.infer<typeof StartSchema>;

export const useInformation: StartBit<IStart>["useInformation"] = () => {
  const { t } = useVocabTranslations(translations);

  return {
    name: t("name"),
    description: t("description"),
    example: {
      subtype: "simple",
      name: t("name"),
      description: t("description"),
      view: {
        markdown: "This is an example. Feel free to use it as a template.",
        title: "Welcome",
      },
    },
  };
};

export const Start: StartBit<IStart>["Start"] = ({ start }) => (
  <Box padding="standard">
    {start.view.title && <Heading>{start.view.title}</Heading>}
    <Markdown markdown={start.view.markdown} />
  </Box>
);

export const ViewForm: StartBit<IStart>["ViewForm"] = ({ name }) => {
  const { t } = useVocabTranslations(translations);
  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.title`}
        label={t("title")}
        defaultValue=""
        render={Input}
      />
      <HookFormController
        name={`${name}.view.markdown`}
        label={t("markdown")}
        defaultValue=""
        render={({ value, onChange, onBlur }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(_, v) => onChange(v)}
            onBlur={onBlur}
          />
        )}
      />
    </Fragment>
  );
};
