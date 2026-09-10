import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this step's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    titleLabel: "Title",
    markdownLabel: "Introduction",
    markdownHint:
      "What this is for, and who will see it. Whatever the learner types is stored in the attempt in the clear, so ask for as little as the job needs — a first name or a pseudonym is usually enough to hand work back.",
    fieldsLabel: "What to ask for",
    fieldsHint:
      "The first one that gets an answer is what a certificate or a report uses as the learner's name, so put that one first.",
    fieldLabel: "Question",
    fieldLabelHint: "A field with no question is never shown.",
    fieldHint: "Hint underneath",
    fieldRequired: "They have to answer this",
    fieldKind: "Kind of answer",
    fieldKindText: "They type it",
    fieldKindSelect: "They pick from a list",
    fieldOptions: "The list, one per line",
    fieldOptionsHint:
      "For an answer that comes from a fixed set — a class, a group. Free text turns twenty people in one class into three different spellings.",
    addField: "Add a question",
    removeField: "Remove this question",
    fieldUnnamed: "Question with no wording",
  },
  de: {
    titleLabel: "Titel",
    markdownLabel: "Einleitung",
    markdownHint:
      "Wofür das ist und wer es sieht. Alles Eingetippte steht unverschlüsselt im Versuch — frag also nur nach dem Nötigsten. Ein Vorname oder ein Pseudonym reicht meist, um Arbeiten zuzuordnen.",
    fieldsLabel: "Wonach gefragt wird",
    fieldsHint:
      "Das erste beantwortete Feld gilt als Name für Urkunde und Bericht — stell es also nach vorn.",
    fieldLabel: "Frage",
    fieldLabelHint: "Ein Feld ohne Frage wird nie angezeigt.",
    fieldHint: "Hinweis darunter",
    fieldRequired: "Muss beantwortet werden",
    fieldKind: "Art der Antwort",
    fieldKindText: "Frei eintippen",
    fieldKindSelect: "Aus einer Liste wählen",
    fieldOptions: "Die Liste, eine pro Zeile",
    fieldOptionsHint:
      "Für Antworten aus einer festen Menge — Klasse, Gruppe. Freitext macht aus zwanzig Leuten einer Klasse drei Schreibweisen.",
    addField: "Frage hinzufügen",
    removeField: "Diese Frage entfernen",
    fieldUnnamed: "Frage ohne Text",
  },
};
