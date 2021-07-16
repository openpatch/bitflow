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
        blanks: {
          a: t("example.blank.a"),
          b: t("example.blank.b"),
        },
        enableRetry: true,
        mode: "auto",
        showFeedback: true,
      },
      feedback: {
        blanks: {
          a: {
            patterns: [
              {
                pattern: t("example.blank.a.feedback.pattern"),
                feedback: {
                  message: t("example.blank.a.feedback.message"),
                  severity: "error",
                },
              },
            ],
          },
        },
      },
      name: t("name"),
      subtype: "fill-in-the-blank",
      view: {
        instruction: t("example.instruction"),
        textWithBlanks: t("example.textWithBlanks"),
      },
    },
  };
};
