import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the table. Markdown is allowed.",
    variablesLabel: "Variables",
    variablesHint:
      "One per line, in the order the table shows them. Every combination becomes a row — three variables make eight.",
    variablesPlaceholder: "A\nB",
    rowCount: "{count} row(s).",
    columnsLabel: "Columns to work out",
    columnsHint:
      "One expression per column. Write them as you would on a board: A AND NOT B, ¬(A ∨ B), A -> B. Nothing here is run; the expression is read into a tree and walked.",
    noColumns: "No columns yet.",
    addColumn: "Add a column",
    expressionOf: "Expression for column {position}",
    expressionPlaceholder: "A AND NOT B",
    labelOf: "Heading for {column}",
    labelPlaceholder: "Leave empty to use the expression",
    givenOf: "Fill {column} in already",
    givenHint:
      "Shown worked out rather than asked for, and never marked. A table that builds up to something is taught by giving away the early columns.",
    moveLeftOf: "Move {column} left",
    moveRightOf: "Move {column} right",
    removeColumnOf: "Remove {column}",
    unnamedColumn: "Column {number}",
    readAsLabel: "Read as",
    previewLabel: "The finished table",
    previewHint:
      "Worked out from the expressions, the same way the learner's answer will be. There is no separate answer key to disagree with it.",
    rowOrderLabel: "Row order",
    rowOrderStandard: "Last variable changes fastest",
    rowOrderReversed: "First variable changes fastest",
    partialCreditLabel: "Give partial credit",
    partialCreditHint:
      "A point per cell instead of one for the whole table. A table that goes wrong in one row got the other rows right.",
    advanced: "Advanced",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über der Tabelle angezeigt. Markdown ist erlaubt.",
    variablesLabel: "Variablen",
    variablesHint:
      "Eine je Zeile, in der Reihenfolge der Tabelle. Jede Kombination wird eine Zeile — drei Variablen ergeben acht.",
    variablesPlaceholder: "A\nB",
    rowCount: "{count} Zeile(n).",
    columnsLabel: "Zu berechnende Spalten",
    columnsHint:
      "Ein Ausdruck je Spalte. Schreib sie wie an der Tafel: A AND NOT B, ¬(A ∨ B), A -> B. Hier wird nichts ausgeführt; der Ausdruck wird in einen Baum gelesen und durchlaufen.",
    noColumns: "Noch keine Spalten.",
    addColumn: "Spalte hinzufügen",
    expressionOf: "Ausdruck für Spalte {position}",
    expressionPlaceholder: "A AND NOT B",
    labelOf: "Überschrift für {column}",
    labelPlaceholder: "Leer lassen, um den Ausdruck zu nutzen",
    givenOf: "{column} schon ausfüllen",
    givenHint:
      "Wird ausgerechnet gezeigt statt gefragt und nie bewertet. Eine Tabelle, die auf etwas hinführt, lehrt, indem sie die frühen Spalten verrät.",
    moveLeftOf: "{column} nach links",
    moveRightOf: "{column} nach rechts",
    removeColumnOf: "{column} entfernen",
    unnamedColumn: "Spalte {number}",
    readAsLabel: "So gelesen",
    previewLabel: "Die fertige Tabelle",
    previewHint:
      "Aus den Ausdrücken berechnet, genau so wie später die Antwort. Es gibt keinen getrennten Lösungsschlüssel, der ihr widersprechen könnte.",
    rowOrderLabel: "Zeilenreihenfolge",
    rowOrderStandard: "Letzte Variable wechselt am schnellsten",
    rowOrderReversed: "Erste Variable wechselt am schnellsten",
    partialCreditLabel: "Teilpunkte vergeben",
    partialCreditHint:
      "Ein Punkt je Zelle statt einer für die ganze Tabelle. Wer in einer Zeile falsch liegt, hat die anderen richtig.",
    advanced: "Erweitert",
  },
};
