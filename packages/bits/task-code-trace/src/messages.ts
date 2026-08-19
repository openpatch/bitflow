import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Code trace",
    description:
      "A program shown as text and a trace table to fill in. The code is never run.",
    howTo:
      "Read the program and fill in the table: one row per moment, one column per thing being watched. Leave a cell empty where the value does not exist yet.",
    howToReadonly: "The table is shown as it was left.",
    codeLabel: "The program",
    codeLabelIn: "The program, in {language}",
    tableLabel: "Trace table",
    stepHeader: "At",
    atLine: "line {line}",
    cellLabel: "{column}, {step}",
    lineChoose: "Choose a line",
    lineOption: "Line {line}: {text}",
    unnamedColumn: "Value",
    unnamedStep: "Step {number}",
    outputNote: "everything printed so far",
    lineNote: "the line that runs next",
    correct: "correct",
    wrong: "wrong",
  },
  de: {
    name: "Programm nachvollziehen",
    description:
      "Ein Programm als Text und eine Tabelle zum Ausfüllen. Der Code wird nie ausgeführt.",
    howTo:
      "Lies das Programm und füll die Tabelle aus: eine Zeile je Zeitpunkt, eine Spalte je beobachteter Sache. Lass eine Zelle leer, wenn es den Wert noch nicht gibt.",
    howToReadonly: "Die Tabelle steht so, wie sie gelassen wurde.",
    codeLabel: "Das Programm",
    codeLabelIn: "Das Programm, in {language}",
    tableLabel: "Ablauftabelle",
    stepHeader: "Bei",
    atLine: "Zeile {line}",
    cellLabel: "{column}, {step}",
    lineChoose: "Zeile wählen",
    lineOption: "Zeile {line}: {text}",
    unnamedColumn: "Wert",
    unnamedStep: "Schritt {number}",
    outputNote: "alles bisher Ausgegebene",
    lineNote: "die Zeile, die als nächste läuft",
    correct: "richtig",
    wrong: "falsch",
  },
};
