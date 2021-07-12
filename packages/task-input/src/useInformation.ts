import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const useInformation: TaskBit["useInformation"] = () => {
  const { t } = useTranslations(translations);

  return {
    name: t("name"),
    description: t("description"),
    example: {
      description: t("description"),
      evaluation: {
        enableRetry: false,
        mode: "auto",
        showFeedback: false,
        pattern: "",
      },
      feedback: {
        patterns: [],
      },
      name: t("name"),
      subtype: "input",
      view: {
        instruction: "",
      },
    },
  };
};
