import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the program. Markdown is allowed.",
    languageLabel: "Language",
    languageHint:
      "Named for the reader only. Nothing here parses, highlights or runs the code.",
    codeLabel: "The program",
    codeHint:
      "Shown to the learner exactly as typed, line for line. It is never executed.",
    columnsLabel: "Columns",
    columnsHint:
      "One per thing being traced: a variable, the output so far, or which line runs next.",
    columnName: "Heading",
    columnNameHint: "A variable name, or what the column shows.",
    columnKind: "What it holds",
    kindValue: "A value",
    kindOutput: "The output so far",
    kindLine: "The next line to run",
    addColumn: "Add a column",
    noColumns: "No columns yet.",
    checkpointsLabel: "Checkpoints",
    checkpointsHint:
      "One per moment in the run, in the order they happen. Fill in what you expect at each; leave a cell empty where the value does not exist yet.",
    checkpointLabel: "When",
    checkpointLabelHint: "“after the loop”, “when i is 2”, “at the end”.",
    checkpointLine: "Line",
    checkpointLineHint: "Marks the row against a line of the listing. Optional.",
    expectedFor: "Expected {column}",
    expectedLineFor: "{column}: line number",
    addCheckpoint: "Add a checkpoint",
    noCheckpoints: "No checkpoints yet.",
    unnamedColumn: "Column without a heading",
    unnamedCheckpoint: "Checkpoint {number}",
    position: "{position} of {total}",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    advanced: "Advanced",
    showLineNumbersLabel: "Number the lines",
    showLineNumbersHint:
      "Always on when a column asks which line runs next, since the answer names one.",
    caseSensitiveLabel: "Capital letters matter",
    caseSensitiveHint:
      "Off, True and true are the same answer — which spelling a language prints is not what is being tested.",
    partialCreditLabel: "Give partial credit",
    partialCreditHint:
      "A point per cell instead of one for the whole table. A trace that goes wrong at step four got the first three right.",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Programm angezeigt. Markdown ist erlaubt.",
    languageLabel: "Sprache",
    languageHint:
      "Nur zur Information. Hier wird nichts geparst, hervorgehoben oder ausgeführt.",
    codeLabel: "Das Programm",
    codeHint:
      "Wird Zeile für Zeile genau so angezeigt, wie es hier steht. Es wird nie ausgeführt.",
    columnsLabel: "Spalten",
    columnsHint:
      "Eine je beobachteter Sache: eine Variable, die bisherige Ausgabe oder die nächste Zeile.",
    columnName: "Überschrift",
    columnNameHint: "Ein Variablenname oder was die Spalte zeigt.",
    columnKind: "Inhalt",
    kindValue: "Ein Wert",
    kindOutput: "Die bisherige Ausgabe",
    kindLine: "Die nächste Zeile",
    addColumn: "Spalte hinzufügen",
    noColumns: "Noch keine Spalten.",
    checkpointsLabel: "Zeitpunkte",
    checkpointsHint:
      "Einer je Moment im Ablauf, in der Reihenfolge des Geschehens. Trag ein, was du erwartest; lass eine Zelle leer, wenn es den Wert noch nicht gibt.",
    checkpointLabel: "Wann",
    checkpointLabelHint: "„nach der Schleife“, „wenn i gleich 2 ist“, „am Ende“.",
    checkpointLine: "Zeile",
    checkpointLineHint:
      "Ordnet die Tabellenzeile einer Programmzeile zu. Optional.",
    expectedFor: "Erwartet für {column}",
    expectedLineFor: "{column}: Zeilennummer",
    addCheckpoint: "Zeitpunkt hinzufügen",
    noCheckpoints: "Noch keine Zeitpunkte.",
    unnamedColumn: "Spalte ohne Überschrift",
    unnamedCheckpoint: "Zeitpunkt {number}",
    position: "{position} von {total}",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    remove: "Entfernen",
    advanced: "Erweitert",
    showLineNumbersLabel: "Zeilen numerieren",
    showLineNumbersHint:
      "Immer an, wenn eine Spalte nach der nächsten Zeile fragt — die Antwort nennt eine.",
    caseSensitiveLabel: "Groß- und Kleinschreibung beachten",
    caseSensitiveHint:
      "Aus sind True und true dieselbe Antwort — welche Schreibweise eine Sprache ausgibt, wird hier nicht geprüft.",
    partialCreditLabel: "Teilpunkte vergeben",
    partialCreditHint:
      "Ein Punkt je Zelle statt einer für die ganze Tabelle. Wer bei Schritt vier falsch liegt, hatte die ersten drei richtig.",
  },
};
