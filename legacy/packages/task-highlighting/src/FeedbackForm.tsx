import {
  AutoGrid,
  Box,
  Checkbox,
  HookFormController,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const FeedbackForm: TaskBit["FeedbackForm"] = ({ name }) => {
  const { t } = useTranslations(translations);
  return (
    <AutoGrid gap="standard">
      <Box>
        <HookFormController
          name={`${name}.feedback.highlightAgreement`}
          defaultValue={true}
          helperText={t("highlight-agreement-description")}
          render={({ value, onChange, onBlur }) => (
            <Checkbox onBlur={onBlur} onChange={onChange} checked={value}>
              {t("highlight-agreement")}
            </Checkbox>
          )}
        />
      </Box>
    </AutoGrid>
  );
};
