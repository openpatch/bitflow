import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this task's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Question",
    instructionHint: "Markdown is supported. This is what the learner reads first.",
    variantLabel: "How many answers are correct?",
    variantSingle: "Exactly one",
    variantMultiple: "One or more",
    choicesLabel: "Choices",
    choicesHint: "Tick the choices that are correct.",
    choicePlaceholder: "Choice text",
    addChoice: "Add choice",
    removeChoice: "Remove choice",
    correctLabel: "Correct",
    advanced: "Advanced",
    shuffleLabel: "Shuffle the choices",
    shuffleHint: "Each learner sees them in a different order.",
    partialCreditLabel: "Give partial credit",
    partialCreditHint: "Score each choice separately instead of all or nothing.",
  },
  de: {
    instructionLabel: "Frage",
    instructionHint: "Markdown ist möglich. Das liest die Schülerin oder der Schüler zuerst.",
    variantLabel: "Wie viele Antworten sind richtig?",
    variantSingle: "Genau eine",
    variantMultiple: "Eine oder mehrere",
    choicesLabel: "Antwortmöglichkeiten",
    choicesHint: "Kreuze die richtigen Antworten an.",
    choicePlaceholder: "Text der Antwort",
    addChoice: "Antwort hinzufügen",
    removeChoice: "Antwort entfernen",
    correctLabel: "Richtig",
    advanced: "Erweitert",
    shuffleLabel: "Antworten mischen",
    shuffleHint: "Jede Person sieht sie in einer anderen Reihenfolge.",
    partialCreditLabel: "Teilpunkte vergeben",
    partialCreditHint: "Jede Antwort einzeln werten statt alles oder nichts.",
  },
};
