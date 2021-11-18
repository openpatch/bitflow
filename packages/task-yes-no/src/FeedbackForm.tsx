import {
  AutoGrid,
  Box,
  HookFormController,
  MarkdownEditor,
  Select,
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
          name={`${name}.feedback.yes.message`}
          label={t("yes")}
          render={({ value, onChange }) => (
            <MarkdownEditor
              value={value}
              variant="input"
              onChange={(v) => onChange(v)}
            />
          )}
        />
        <HookFormController
          name={`${name}.feedback.yes.severity`}
          defaultValue="error"
          render={({ value, onChange, onBlur }) => (
            <Select value={value} onChange={onChange} onBlur={onBlur}>
              <option value="error">{t("severity.error")}</option>
              <option value="warning">{t("severity.warning")}</option>
              <option value="info">{t("severity.info")}</option>
              <option value="success">{t("severity.success")}</option>
            </Select>
          )}
        />
      </Box>
      <Box>
        <HookFormController
          name={`${name}.feedback.no.message`}
          label={t("no")}
          render={({ value, onChange }) => (
            <MarkdownEditor
              value={value}
              variant="input"
              onChange={(v) => onChange(v)}
            />
          )}
        />
        <HookFormController
          name={`${name}.feedback.no.severity`}
          defaultValue="error"
          render={({ value, onChange, onBlur }) => (
            <Select value={value} onChange={onChange} onBlur={onBlur}>
              <option value="error">{t("severity.error")}</option>
              <option value="warning">{t("severity.warning")}</option>
              <option value="info">{t("severity.info")}</option>
              <option value="success">{t("severity.success")}</option>
            </Select>
          )}
        />
      </Box>
    </AutoGrid>
  );
};
