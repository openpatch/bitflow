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
        choices: {
          a: {
            checkedFeedback: {
              message: t("example.feedback.a.checked"),
              severity: "error",
            },
          },
          b: {
            notCheckedFeedback: {
              message: t("example.feedback.b.notChecked"),
              severity: "error",
            },
          },
        },
        patterns: {
          ac: {
            message: t("example.feedback.pattern.ac"),
            severity: "error",
          },
        },
      },
      name: t("name"),
      view: {
        choices: [
          {
            markdown: t("example.choice.a"),
          },
          {
            markdown: t("example.choice.b"),
          },
          {
            markdown: t("example.choice.c"),
          },
          {
            markdown: t("example.choice.d"),
          },
        ],
        instruction: t("example.instruction"),
        variant: "multiple",
      },
    },
  };
};
