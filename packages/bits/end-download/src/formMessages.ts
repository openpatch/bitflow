import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this step's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    titleLabel: "Title",
    markdownLabel: "Closing message",
    markdownHint: "Markdown is supported.",
    buttonLabelLabel: "Wording on the button",
    buttonLabelHint: "Leave empty for “Save your answers”.",
    filenameLabel: "File name",
    filenameHint: "Without .json, which is added. Spaces become dashes.",
    includeAnswersLabel: "Include what they wrote",
    includeAnswersHint:
      "On, the file is a complete record that can be loaded back into the assessment and marked again. Off, it carries the outcomes and timings and no answers — and no written reasoning either, which gives just as much away.",
  },
  de: {
    titleLabel: "Titel",
    markdownLabel: "Abschlusstext",
    markdownHint: "Markdown ist möglich.",
    buttonLabelLabel: "Beschriftung der Schaltfläche",
    buttonLabelHint: "Leer lassen für „Antworten speichern“.",
    filenameLabel: "Dateiname",
    filenameHint: "Ohne .json, das wird ergänzt. Leerzeichen werden zu Bindestrichen.",
    includeAnswersLabel: "Antworten mitnehmen",
    includeAnswersHint:
      "An: eine vollständige Aufzeichnung, die sich wieder laden und neu bewerten lässt. Aus: nur Ergebnisse und Zeiten, keine Antworten — und auch keine Begründungen, die genauso viel verraten.",
  },
};
