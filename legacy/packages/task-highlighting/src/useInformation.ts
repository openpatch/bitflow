import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const useInformation: TaskBit["useInformation"] = () => {
  const { t } = useTranslations(translations);

  return {
    name: t("name"),
    description: t("description"),
    example: {
      subtype: "highlighting",
      description: "",
      name: t("name"),
      view: {
        instruction: t("example.instruction"),
        text: t("example.text"),
        colors: {
          maroon: { enabled: true },
          lavender: { enabled: true, label: "Veggies" },
          blue: { enabled: false },
          yellow: { enabled: false },
          orange: { enabled: false },
        },
      },
      evaluation: {
        enableRetry: true,
        mode: "auto",
        showFeedback: true,
        cutoffs: {
          orange: 0,
          lavender: 0,
          maroon: 0.8,
          yellow: 0,
          blue: 0,
        },
        highlights: new Array(t("example.text").length)
          .fill(null)
          .fill("maroon", 0, 3),
      },
      feedback: {
        highlightAgreement: false,
      },
    },
  };
};
