import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the area. Markdown is allowed.",
    targetsLabel: "Targets",
    targetsHint:
      "Click the area below to add a target, or drag one to move it. They are shown one at a time, in this order.",
    noTargets: "No targets yet. Click the area to add one.",
    targetAt: "Target {number} — {x}% across, {y}% down, {size}% wide",
    radiusLabel: "Size",
    remove: "Remove",
    clear: "Remove all",
    aspectLabel: "Shape of the area",
    aspectHint: "Its height as a fraction of its width. Wider areas make for longer moves.",
    scoringLabel: "Count",
    scoringHint:
      "Speed adds a second point per target for a hit inside the allowance, so accuracy still counts on its own.",
    scoringHits: "A point per target hit",
    scoringHitsAndSpeed: "A point for the hit, another for hitting it in time",
    allowanceLabel: "Time allowed per target",
    allowanceHint: "Milliseconds. Only used when speed is being counted.",
    optOutLabel: "Let the learner stand down",
    optOutHint:
      "This task needs a pointing device. Standing down leaves it unmarked rather than wrong, so it neither helps nor hurts the learner's total. Turn this off only where an equivalent task is offered another way.",
    advanced: "Advanced",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über der Fläche angezeigt. Markdown ist erlaubt.",
    targetsLabel: "Ziele",
    targetsHint:
      "Klick in die Fläche, um ein Ziel hinzuzufügen, oder zieh eines an eine andere Stelle. Sie erscheinen einzeln in dieser Reihenfolge.",
    noTargets: "Noch keine Ziele. Klick in die Fläche, um eines anzulegen.",
    targetAt: "Ziel {number} — {x}% von links, {y}% von oben, {size}% breit",
    radiusLabel: "Größe",
    remove: "Entfernen",
    clear: "Alle entfernen",
    aspectLabel: "Form der Fläche",
    aspectHint: "Höhe im Verhältnis zur Breite. Breitere Flächen bedeuten längere Wege.",
    scoringLabel: "Zählung",
    scoringHint:
      "Mit Tempo gibt es einen zweiten Punkt pro Ziel, wenn es rechtzeitig getroffen wird — Genauigkeit zählt weiterhin für sich.",
    scoringHits: "Ein Punkt pro getroffenem Ziel",
    scoringHitsAndSpeed: "Ein Punkt fürs Treffen, einer fürs rechtzeitige Treffen",
    allowanceLabel: "Erlaubte Zeit pro Ziel",
    allowanceHint: "Millisekunden. Wird nur verwendet, wenn Tempo zählt.",
    optOutLabel: "Abmelden erlauben",
    optOutHint:
      "Diese Aufgabe braucht ein Zeigegerät. Wer sich abmeldet, bekommt sie unbewertet statt falsch — es hilft also weder noch schadet es. Schalte das nur aus, wenn es eine gleichwertige Aufgabe auf anderem Weg gibt.",
    advanced: "Erweitert",
  },
};
