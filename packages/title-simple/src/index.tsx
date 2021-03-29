import {
  TitleProps,
  TitleSchema as TitleSchemaBase,
  TitleViewFormProps,
} from "@bitflow/base";
import {
  Box,
  Heading,
  HookFormController,
  Input,
  Markdown,
  MarkdownEditor,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, Fragment } from "react";
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

export const Title: FC<TitleProps<ITitle>> = ({ title }) => {
  return (
    <Box px="standard">
      <Heading as="h1" textAlign="center">
        {title.view.title}
      </Heading>
      <Markdown markdown={title.view.message}></Markdown>
    </Box>
  );
};

export const ViewForm = ({ name }: TitleViewFormProps) => {
  const { t } = useTranslations(translations);
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
