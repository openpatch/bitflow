import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const useInformation: TaskBit["useInformation"] = () => {
  const { t } = useTranslations(translations);

  return {
    name: t("name"),
    description: t("description"),
    example: {
      subtype: "yes-no",
      description: "",
      name: t("name"),
      view: {
        question: t("question"),
      },
      evaluation: {
        enableRetry: true,
        mode: "auto",
        showFeedback: true,
        yes: true,
      },
      feedback: {
        no: {
          message: t("example.feedback.no"),
          severity: "error",
        },
        yes: {
          message: t("example.feedback.yes"),
          severity: "success",
        },
      },
    },
  };
};
