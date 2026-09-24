import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings. The authoring form's labels live in
 * `formMessages.ts`, so each catalog can be complete in the languages it
 * declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Number line",
    description:
      "A number line the learner places one or more values on — fractions, decimals, roots, negative numbers — each marked by how close it lands.",
    howTo:
      "Choose a value below, then tap the line to place it. Drag a placed value to move it, or focus it and use the arrow keys.",
    howToReadonly: "The line is shown as it was left.",
    diagramLabel: "Number line",
    paletteLabel: "Value to place",
    placedSuffix: "placed at {value}",
    itemsLegend: "Placed values",
    itemRowPlaced: "{label}: {value}",
    itemRowUnplaced: "{label}: not yet placed",
    placed: "{label} placed at {value}",
    moved: "{label} moved to {value}",
    correct: "correct",
    wrong: "wrong",
    correctValue: "Correct position: {value}",
  },
  de: {
    name: "Zahlenstrahl",
    description:
      "Ein Zahlenstrahl, auf dem ein oder mehrere Werte platziert werden — Brüche, Dezimalzahlen, Wurzeln, negative Zahlen — jeweils danach bewertet, wie nah sie liegen.",
    howTo:
      "Wähle unten einen Wert und tippe dann auf den Strahl, um ihn zu platzieren. Ziehe einen platzierten Wert, um ihn zu verschieben, oder fokussiere ihn und nutze die Pfeiltasten.",
    howToReadonly: "Der Zahlenstrahl steht so, wie er gelassen wurde.",
    diagramLabel: "Zahlenstrahl",
    paletteLabel: "Zu platzierender Wert",
    placedSuffix: "platziert bei {value}",
    itemsLegend: "Platzierte Werte",
    itemRowPlaced: "{label}: {value}",
    itemRowUnplaced: "{label}: noch nicht platziert",
    placed: "{label} bei {value} platziert",
    moved: "{label} nach {value} verschoben",
    correct: "richtig",
    wrong: "falsch",
    correctValue: "Richtige Position: {value}",
  },
};
