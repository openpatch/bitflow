import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings. The authoring form's labels live in
 * `formMessages.ts`, so each catalog can be complete in the languages it
 * declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Classify points",
    description:
      "A scatter plot where some points are already classified — or marked as a cluster's centre — and the rest are open for the learner to assign.",
    howTo:
      "Choose a class below, then tap an open point (shown hollow, with a “?”) to assign it. Tap the same class again to clear a point.",
    howToReadonly: "The plot is shown as it was left.",
    diagramLabel: "Scatter plot",
    paletteLabel: "Class to assign",
    assignmentsLabel: "Assign each point",
    assignmentsHint: "The same as tapping a point above.",
    pointRow: "Point {label} ({x}, {y})",
    selectLabel: "Class for {point}",
    chooseClass: "Choose a class",
    unnamedPoint: "{number}",
    centroidTitle: "Centre of {class}",
    knownTitle: "{label}, class {class}",
    openUnassigned: "{label}, not yet assigned",
    openAssigned: "{label}, assigned to {class}",
    correct: "correct",
    wrong: "wrong",
    writtenOut: "List the points as text",
    xAxisNote: "x: {label}",
    yAxisNote: "y: {label}",
  },
  de: {
    name: "Punkte zuordnen",
    description:
      "Ein Streudiagramm, in dem einige Punkte schon klassifiziert — oder als Zentrum eines Clusters markiert — sind; die übrigen sollen zugeordnet werden.",
    howTo:
      "Wähle unten eine Klasse und tippe dann auf einen offenen Punkt (hohl dargestellt, mit „?“), um ihn zuzuordnen. Tippe dieselbe Klasse erneut an, um die Zuordnung zu löschen.",
    howToReadonly: "Das Diagramm steht so, wie es gelassen wurde.",
    diagramLabel: "Streudiagramm",
    paletteLabel: "Zuzuordnende Klasse",
    assignmentsLabel: "Jeden Punkt zuordnen",
    assignmentsHint: "Dasselbe wie oben auf einen Punkt zu tippen.",
    pointRow: "Punkt {label} ({x}, {y})",
    selectLabel: "Klasse für {point}",
    chooseClass: "Klasse wählen",
    unnamedPoint: "{number}",
    centroidTitle: "Zentrum von {class}",
    knownTitle: "{label}, Klasse {class}",
    openUnassigned: "{label}, noch nicht zugeordnet",
    openAssigned: "{label}, zugeordnet zu {class}",
    correct: "richtig",
    wrong: "falsch",
    writtenOut: "Punkte als Text auflisten",
    xAxisNote: "x: {label}",
    yAxisNote: "y: {label}",
  },
};
