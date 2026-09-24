import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the array. Markdown is allowed.",
    modeLabel: "How the learner answers",
    modeRearrange: "Rearrange — swap boxes into place",
    modeWrite: "Write — type each box",
    modeHint:
      "Rearrange keeps the same values and only moves them, for a sort. Write lets a row grow or shrink, for a stack or a queue.",
    initialLabel: "Starting array",
    initialHint: "Comma-separated, in order: 5, 2, 8, 1, 9",
    initialPlaceholder: "5, 2, 8, 1, 9",
    parsedAs: "Parsed as: {list} ({count} values)",
    parsedEmpty: "No values yet.",
    stepsLabel: "Steps",
    stepsHint:
      "One per moment worth checking, in the order they happen — a pass, a push, a pop.",
    stepLabelLabel: "Label",
    stepLabelPlaceholder: "“After pass 1”, “push(4)”",
    stepExpectedLabel: "The array after this step",
    stepExpectedHint: "Comma-separated, in the order the boxes read.",
    addStep: "Add a step",
    noSteps: "No steps yet.",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    unnamedStep: "Step {number}",
    position: "Step {position}",
    advanced: "Advanced",
    showIndicesLabel: "Number the boxes",
    showIndicesHint: "Shows the index above each box.",
    caseSensitiveLabel: "Capital letters matter",
    caseSensitiveHint:
      "Off, “Sorted” and “sorted” are the same answer — which is rarely what a trace is testing.",
    partialCreditLabel: "Give partial credit",
    partialCreditHint:
      "A point per correct step instead of one for the whole task. A sort that goes wrong on the last pass had every earlier one right.",
    slotsLabel: "Number of boxes",
    slotsHint:
      "Write mode only. Leave blank to use the widest row already written; set it if the array can grow past that.",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Array angezeigt. Markdown ist erlaubt.",
    modeLabel: "Wie die Lernenden antworten",
    modeRearrange: "Umordnen — Felder tauschen",
    modeWrite: "Schreiben — jedes Feld eintippen",
    modeHint:
      "Umordnen behält dieselben Werte und bewegt sie nur, für ein Sortierverfahren. Schreiben lässt eine Zeile wachsen oder schrumpfen, für einen Stack oder eine Warteschlange.",
    initialLabel: "Startarray",
    initialHint: "Kommagetrennt, in Reihenfolge: 5, 2, 8, 1, 9",
    initialPlaceholder: "5, 2, 8, 1, 9",
    parsedAs: "Erkannt als: {list} ({count} Werte)",
    parsedEmpty: "Noch keine Werte.",
    stepsLabel: "Schritte",
    stepsHint:
      "Einer je prüfenswertem Moment, in der Reihenfolge des Geschehens — ein Durchgang, ein Push, ein Pop.",
    stepLabelLabel: "Bezeichnung",
    stepLabelPlaceholder: "„Nach Durchgang 1“, „push(4)“",
    stepExpectedLabel: "Das Array nach diesem Schritt",
    stepExpectedHint: "Kommagetrennt, in der Reihenfolge der Felder.",
    addStep: "Schritt hinzufügen",
    noSteps: "Noch keine Schritte.",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    remove: "Entfernen",
    unnamedStep: "Schritt {number}",
    position: "Schritt {position}",
    advanced: "Erweitert",
    showIndicesLabel: "Felder nummerieren",
    showIndicesHint: "Zeigt den Index über jedem Feld.",
    caseSensitiveLabel: "Groß- und Kleinschreibung beachten",
    caseSensitiveHint:
      "Aus sind „Sorted“ und „sorted“ dieselbe Antwort — das ist selten das, was ein Ablauf prüfen soll.",
    partialCreditLabel: "Teilpunkte vergeben",
    partialCreditHint:
      "Ein Punkt je richtigem Schritt statt einer für die ganze Aufgabe. Wer beim letzten Durchgang falsch liegt, hatte alle vorherigen richtig.",
    slotsLabel: "Anzahl der Felder",
    slotsHint:
      "Nur im Schreiben-Modus. Leer lassen, um die breiteste bereits geschriebene Zeile zu verwenden; setzen, wenn das Array darüber hinauswachsen kann.",
  },
};
