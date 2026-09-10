import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this step's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    titleLabel: "Title",
    markdownLabel: "What the learner is agreeing to",
    markdownHint:
      "Say what is recorded, why, and who can see it. Be specific — the tasks that measure pointing or typing keep task results only, never a key log and nothing about the device. Markdown is supported.",
    agreeLabelLabel: "Wording for agreeing",
    agreeLabelHint: "Leave empty for “I agree to take part.”",
    allowDeclineLabel: "Let the learner say no",
    allowDeclineHint:
      "Consent that cannot be refused is not consent. Connect the “no” route to somewhere sensible — an alternative, or an end.",
    declineLabelLabel: "Wording for saying no",
    declineLabelHint: "Leave empty for “I would rather not take part.”",
    requiredHintLabel: "Shown until they have chosen",
    requiredHintHint: "Leave empty for “Choose one before you start.”",
  },
  de: {
    titleLabel: "Titel",
    markdownLabel: "Wozu die Zustimmung gilt",
    markdownHint:
      "Sag, was aufgezeichnet wird, warum, und wer es sehen kann. Konkret — die Aufgaben zu Maus und Tastatur speichern nur Aufgabenergebnisse, kein Tastenprotokoll und nichts über das Gerät. Markdown ist möglich.",
    agreeLabelLabel: "Text für die Zustimmung",
    agreeLabelHint: "Leer lassen für „Ich mache mit.“",
    allowDeclineLabel: "Ablehnen erlauben",
    allowDeclineHint:
      "Eine Zustimmung, die man nicht verweigern kann, ist keine. Verbinde den „Nein“-Weg mit etwas Sinnvollem — einer Alternative oder einem Ende.",
    declineLabelLabel: "Text zum Ablehnen",
    declineLabelHint: "Leer lassen für „Ich möchte lieber nicht mitmachen.“",
    requiredHintLabel: "Hinweis, solange nichts gewählt ist",
    requiredHintHint: "Leer lassen für „Wähle eins aus, bevor es losgeht.“",
  },
};
