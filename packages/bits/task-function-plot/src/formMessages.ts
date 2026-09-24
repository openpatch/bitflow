import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the plot. Markdown is allowed.",
    xAxisLegend: "X axis",
    yAxisLegend: "Y axis",
    axisLabelField: "Label",
    axisMinField: "Minimum",
    axisMaxField: "Maximum",
    axisStepField: "Step",
    targetLabel: "Target function",
    targetHint:
      "The function of x the learner sketches, e.g. “0.5x^2 - 2”. Accepts + − × ÷ ^, sqrt, sin, cos, exp, ln, abs, pi, e, and implicit multiplication like 3x.",
    shownLabel: "Shown curves",
    shownHint:
      "Drawn for reference and never scored — the f behind a “sketch f′” question, say. Unlike the target, a shown curve may leave the y‑axis.",
    noShown: "No reference curves. The learner sketches against the target alone.",
    shownExpressionPlaceholder: "Function of x",
    shownExpressionOf: "Function of curve {position}",
    shownLabelPlaceholder: "Label",
    shownLabelOf: "Label of curve {position}",
    removeShownOf: "Remove curve {position}",
    addShown: "Add a curve",
    handlesLabel: "Handles",
    handlesHint: "The x positions the learner sets a value at, separated by commas.",
    spreadCountLabel: "Count",
    spreadApply: "Spread evenly",
    previewLabel: "Preview",
    previewHint: "The shown curves, the target, and the handles at the target's own values.",
    advanced: "Advanced",
    toleranceLabel: "Tolerance",
    toleranceHint:
      "How far from the target, in y units, still counts as right. Defaults to half the y‑axis's step.",
    snapLabel: "Snap",
    snapHint: "How finely a handle's value can be set.",
    "snap-none": "None — freehand",
    "snap-grid": "Grid step",
    "snap-half": "Half a grid step",
    partialCreditLabel: "Give partial credit",
    partialCreditHint:
      "A point per handle instead of one for the whole plot. Four handles right out of five is four fifths of the mark.",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Diagramm angezeigt. Markdown ist erlaubt.",
    xAxisLegend: "x-Achse",
    yAxisLegend: "y-Achse",
    axisLabelField: "Beschriftung",
    axisMinField: "Minimum",
    axisMaxField: "Maximum",
    axisStepField: "Schrittweite",
    targetLabel: "Zielfunktion",
    targetHint:
      "Die Funktion von x, die skizziert werden soll, z. B. „0.5x^2 - 2“. Erlaubt sind + − × ÷ ^, sqrt, sin, cos, exp, ln, abs, pi, e sowie implizite Multiplikation wie 3x.",
    shownLabel: "Angezeigte Kurven",
    shownHint:
      "Werden nur zur Orientierung gezeichnet und nie bewertet — etwa das f hinter einer „skizziere f′“-Aufgabe. Anders als die Zielfunktion darf eine angezeigte Kurve die y‑Achse verlassen.",
    noShown: "Keine Referenzkurven. Die Lernenden skizzieren allein gegen die Zielfunktion.",
    shownExpressionPlaceholder: "Funktion von x",
    shownExpressionOf: "Funktion von Kurve {position}",
    shownLabelPlaceholder: "Beschriftung",
    shownLabelOf: "Beschriftung von Kurve {position}",
    removeShownOf: "Kurve {position} entfernen",
    addShown: "Kurve hinzufügen",
    handlesLabel: "Anhaltspunkte",
    handlesHint:
      "Die x‑Stellen, an denen die Lernenden einen Wert setzen, durch Kommas getrennt.",
    spreadCountLabel: "Anzahl",
    spreadApply: "Gleichmäßig verteilen",
    previewLabel: "Vorschau",
    previewHint:
      "Die angezeigten Kurven, die Zielfunktion und die Anhaltspunkte bei ihren jeweils richtigen Werten.",
    advanced: "Erweitert",
    toleranceLabel: "Toleranz",
    toleranceHint:
      "Wie weit ein Wert von der Zielfunktion abweichen darf, in y‑Einheiten. Standardmäßig die halbe Schrittweite der y‑Achse.",
    snapLabel: "Einrasten",
    snapHint: "Wie fein der Wert eines Anhaltspunkts gesetzt werden kann.",
    "snap-none": "Keins — freihändig",
    "snap-grid": "Ganze Schrittweite",
    "snap-half": "Halbe Schrittweite",
    partialCreditLabel: "Teilpunkte vergeben",
    partialCreditHint:
      "Ein Punkt je Anhaltspunkt statt einer für das ganze Diagramm. Vier von fünf richtig sind vier Fünftel der Wertung.",
  },
};
