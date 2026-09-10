import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this step's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    titleLabel: "Heading on the certificate",
    markdownLabel: "Message",
    markdownHint: "Markdown is supported.",
    issuerLabel: "Set by",
    issuerHint: "The school, course or teacher. Printed under the message.",
    showNameLabel: "Show the learner's name",
    showNameHint:
      "Taken from a “Who you are” step in this assessment — its first answered question. Nothing is shown if the assessment never asked.",
    showScoreLabel: "Show the score",
    showDateLabel: "Show the date it was finished",
    printLabelLabel: "Wording on the print button",
    printLabelHint: "Leave empty for “Print this”.",
  },
  de: {
    titleLabel: "Überschrift der Urkunde",
    markdownLabel: "Text",
    markdownHint: "Markdown ist möglich.",
    issuerLabel: "Gestellt von",
    issuerHint: "Schule, Kurs oder Lehrkraft. Steht unter dem Text.",
    showNameLabel: "Namen anzeigen",
    showNameHint:
      "Kommt aus einem „Wer du bist“-Schritt in diesem Test — dessen erster beantworteten Frage. Ohne solchen Schritt steht dort nichts.",
    showScoreLabel: "Punkte anzeigen",
    showDateLabel: "Datum des Abschlusses anzeigen",
    printLabelLabel: "Beschriftung der Druck-Schaltfläche",
    printLabelHint: "Leer lassen für „Drucken“.",
  },
};
