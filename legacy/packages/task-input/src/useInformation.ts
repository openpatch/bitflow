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
        pattern: "[tT]ype[sS]cript",
      },
      feedback: {
        patterns: [
          {
            pattern: "[Jj]ava[Ss]cript",
            feedback: {
              message: "Close. Now add types.",
              severity: "warning",
            },
          },
          {
            pattern: "[Jj]ava",
            feedback: {
              message: "No thanks.",
              severity: "error",
            },
          },
        ],
      },
      name: t("name"),
      subtype: "input",
      view: {
        instruction:
          "Name the *programming lanuage* which is primarly used for implementing **Bitflow**.",
      },
    },
  };
};
