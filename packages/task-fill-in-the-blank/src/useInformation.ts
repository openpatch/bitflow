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
        blanks: {},
        enableRetry: false,
        mode: "auto",
        showFeedback: false,
      },
      feedback: {
        blanks: {},
      },
      name: t("name"),
      subtype: "fill-in-the-blank",
      view: {
        instruction: "",
        textWithBlanks: "",
      },
    },
  };
};
