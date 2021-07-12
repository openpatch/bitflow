import {
  TitleBit as TitleBitBase,
  TitleSchema as TitleSchemaBase,
} from "@bitflow/core";
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
import * as z from "zod";
import translations from "./locales.vocab";

export const TitleSchema = TitleSchemaBase.merge(
  z.object({
    subtype: z.literal("simple"),
    view: z.object({
      title: z.string(),
      message: z.string(),
    }),
  })
);

export type ITitle = z.infer<typeof TitleSchema>;

type TitleBit = TitleBitBase<ITitle>;

export const useInformation: TitleBit["useInformation"] = () => {
  const { t } = useVocabTranslations(translations);
  return {
    name: t("name"),
    description: t("description"),
    example: {
      description: t("description"),
      name: t("name"),
      subtype: "simple",
      view: {
        message: "",
        title: "",
      },
    },
  };
};

export const Title: TitleBit["Title"] = ({ title }) => {
  return (
    <Box px="standard">
      <Heading as="h1" textAlign="center">
        {title.view.title}
      </Heading>
      <Markdown markdown={title.view.message}></Markdown>
    </Box>
  );
};

export const ViewForm: TitleBit["ViewForm"] = ({ name }) => {
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
        name={`${name}.view.message`}
        label={t("message")}
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
