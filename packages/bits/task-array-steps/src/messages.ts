import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Algorithm steps",
    description:
      "An array and the steps of an algorithm over it. The learner writes down or rearranges the array as it stands after each step.",
    howToRearrange:
      "Tap a box, then the one you want to swap it with. With a keyboard: the arrow keys move between boxes, Enter or Space picks one up or swaps it, Escape cancels.",
    howToWrite: "Type the array as it stands after each step. Leave a box empty where nothing belongs there.",
    howToReadonly: "The arrays are shown as they were left.",
    initialLabel: "Starting array",
    unnamedStep: "Step {number}",
    holding: "Holding {value} in {step}",
    putDown: "Put down",
    swapped: "Swapped {a} and {b} in {step}",
    cellLabel: "{value}, position {position} of {total}, {step}",
    cellInputLabel: "Position {position} of {total}, {step}",
    emptyCell: "empty",
    correct: "correct",
    wrong: "wrong",
  },
  de: {
    name: "Algorithmus Schritt für Schritt",
    description:
      "Ein Array und die Schritte eines Algorithmus darüber. Die Lernenden schreiben das Array nach jedem Schritt auf oder ordnen es neu.",
    howToRearrange:
      "Tippe auf ein Feld, dann auf das Feld, mit dem es getauscht werden soll. Mit der Tastatur: Die Pfeiltasten bewegen zwischen den Feldern, Enter oder Leertaste nimmt ein Feld auf oder tauscht es, Escape bricht ab.",
    howToWrite:
      "Schreibe das Array so, wie es nach jedem Schritt aussieht. Lass ein Feld leer, wenn dort nichts steht.",
    howToReadonly: "Die Arrays stehen so, wie sie gelassen wurden.",
    initialLabel: "Startarray",
    unnamedStep: "Schritt {number}",
    holding: "{value} in {step} aufgenommen",
    putDown: "Abgelegt",
    swapped: "{a} und {b} in {step} getauscht",
    cellLabel: "{value}, Position {position} von {total}, {step}",
    cellInputLabel: "Position {position} von {total}, {step}",
    emptyCell: "leer",
    correct: "richtig",
    wrong: "falsch",
  },
};
