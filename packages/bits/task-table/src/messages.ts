import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Fill in the table",
    description:
      "A table with blank cells to fill in, marked cell by cell — a query result, a value table, a formula copied down.",
    howTo: "Fill in the empty cells.",
    howToAnyOrder: "Fill in the empty cells. The order of the rows does not matter.",
    howToReadonly: "The table is shown as it was left.",
    tableLabel: "Table",
    unnamedColumn: "Column {number}",
    unnamedRow: "Row {number}",
    cellLabel: "{column}, {row}",
    correct: "correct",
    wrong: "wrong",
  },
  de: {
    name: "Tabelle ausfüllen",
    description:
      "Eine Tabelle mit leeren Zellen zum Ausfüllen, Zelle für Zelle bewertet — ein Abfrageergebnis, eine Wertetabelle, eine kopierte Formel.",
    howTo: "Fülle die leeren Zellen aus.",
    howToAnyOrder: "Fülle die leeren Zellen aus. Die Reihenfolge der Zeilen spielt keine Rolle.",
    howToReadonly: "Die Tabelle steht so, wie sie gelassen wurde.",
    tableLabel: "Tabelle",
    unnamedColumn: "Spalte {number}",
    unnamedRow: "Zeile {number}",
    cellLabel: "{column}, {row}",
    correct: "richtig",
    wrong: "falsch",
  },
};
