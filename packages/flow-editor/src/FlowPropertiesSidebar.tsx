import {
  Box,
  Checkbox,
  HookFormController,
  Input,
  MarkdownEditor,
  Select,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { HeaderSidebar } from "./HeaderSidebar";
import translations from "./locales.vocab";

export const FlowPropertiesSidebar = () => {
  const { t } = useTranslations(translations);

  const languages = ["en", "de", "fr", "es", "nl", "pt", "tr", "it"] as const;
  const translatedLanguages = languages
    .map((lang) => [lang, t(`lang-${lang}`)])
    .sort(([_, a], [, b]) => a.localeCompare(b));

  return (
    <HeaderSidebar header={t("flow-properties")}>
      <HookFormController
        name="draft"
        render={({ value, onChange }) => (
          <Box mt="standard">
            <Checkbox checked={value} onChange={onChange}>
              {t("draft")}
            </Checkbox>
          </Box>
        )}
      />
      <HookFormController
        label={t("name")}
        name={"name"}
        defaultValue=""
        render={Input}
      />
      <HookFormController
        label={t("description")}
        name="description"
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
      <HookFormController
        label={t("language")}
        name="language"
        defaultValue="en"
        render={({ value, onChange, onBlur }) => (
          <Select value={value} onChange={onChange} onBlur={onBlur}>
            {translatedLanguages.map((tl) => (
              <option value={tl[0]}>{tl[1]}</option>
            ))}
          </Select>
        )}
      />
      <HookFormController
        label={t("visibility")}
        name="visibility"
        defaultValue="private"
        render={({ value, onChange, onBlur }) => (
          <Select value={value} onChange={onChange} onBlur={onBlur}>
            <option value="public">{t("public")}</option>
            <option value="private">{t("private")}</option>
            <option value="unlisted">{t("unlisted")}</option>
          </Select>
        )}
      />
    </HeaderSidebar>
  );
};
