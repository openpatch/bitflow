import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const useInformation: TaskBit["useInformation"] = () => {
  const { t } = useTranslations(translations);

  return {
    name: t("name"),
    description: t("description"),
    example: {
      subtype: "choice",
      description: t("description"),
      evaluation: {
        correct: [],
        enableRetry: false,
        mode: "auto",
        showFeedback: false,
      },
      feedback: {
        choices: {},
        patterns: {},
      },
      name: "",
      view: {
        choices: [
          {
            markdown: "",
          },
        ],
        instruction: "",
        variant: "single",
      },
    },
  };
};
