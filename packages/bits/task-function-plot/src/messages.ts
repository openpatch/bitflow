import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings. The authoring form's labels live in
 * `formMessages.ts`, so each catalog can be complete in the languages it
 * declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Sketch the graph",
    description:
      "A coordinate system the learner sketches a function into by setting its value at a few fixed x positions, marked against how close each one is to the function the author gave.",
    howTo:
      "Drag a handle's knob up or down, or tap anywhere on its dashed line, to set the value there. The number fields below the plot do the same thing.",
    howToReadonly: "The plot is shown as it was left.",
    diagramLabel: "Function plot",
    handleSet: "x = {x} set to {y}",
    knobLabel: "Value at x = {x}",
    knobValueText: "x = {x}: y = {y}",
    knobValueStateText: "x = {x}: y = {y}, {state}",
    correct: "correct",
    wrong: "wrong",
    unnamedCurve: "Curve {number}",
    targetLegend: "Target",
    valuesLabel: "Set each value exactly",
    valuesHint: "The same as dragging or tapping the plot above.",
    handleRow: "x = {x}",
    handleFieldLabel: "y at x = {x}",
  },
  de: {
    name: "Graph skizzieren",
    description:
      "Ein Koordinatensystem, in das die Lernenden eine Funktion einzeichnen, indem sie ihren Wert an ein paar festen x‑Stellen setzen — bewertet danach, wie nah jeder Wert an der vom Autor vorgegebenen Funktion liegt.",
    howTo:
      "Ziehe den Punkt eines Anhaltspunkts nach oben oder unten, oder tippe irgendwo auf seine gestrichelte Linie, um dort den Wert zu setzen. Die Zahlenfelder unter dem Diagramm tun dasselbe.",
    howToReadonly: "Das Diagramm steht so, wie es gelassen wurde.",
    diagramLabel: "Funktionsgraph",
    handleSet: "x = {x} auf {y} gesetzt",
    knobLabel: "Wert bei x = {x}",
    knobValueText: "x = {x}: y = {y}",
    knobValueStateText: "x = {x}: y = {y}, {state}",
    correct: "richtig",
    wrong: "falsch",
    unnamedCurve: "Kurve {number}",
    targetLegend: "Zielfunktion",
    valuesLabel: "Jeden Wert genau setzen",
    valuesHint: "Dasselbe wie oben im Diagramm zu ziehen oder zu tippen.",
    handleRow: "x = {x}",
    handleFieldLabel: "y bei x = {x}",
  },
};
