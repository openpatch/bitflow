import {
  PrivacyProps,
  PrivacySchema as PrivacySchemaBase,
  PrivacyViewFormProps,
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

export const PrivacySchema = PrivacySchemaBase.merge(
  z.object({
    subtype: z.literal("markdown"),
    view: z.object({
      markdown: z.string(),
    }),
  })
);

export type IPrivacy = z.infer<typeof PrivacySchema>;

export const Privacy: FC<PrivacyProps<IPrivacy>> = ({ privacy }) => {
  return (
    <Box px="standard">
      <Markdown markdown={privacy.view.markdown} />
    </Box>
  );
};

export const ViewForm = ({ name }: PrivacyViewFormProps) => {
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
