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
    columnNamePlaceholder: "Heading",
    columnNameOf: "Heading of column {position}",
    columnKindOf: "What {column} holds",
    moveLeftOf: "Move {column} left",
    moveRightOf: "Move {column} right",
    removeColumnOf: "Remove {column}",
    kindValue: "A value",
    kindOutput: "The output so far",
    kindLine: "The next line to run",
    addColumn: "Add a column",
    noColumns: "No columns yet.",
    checkpointsLabel: "Checkpoints",
    checkpointsHint:
      "One per moment in the run, in the order they happen. Name it and say which line it sits at; the values themselves go in the table below.",
    checkpointLabelPlaceholder: "“after the loop”, “when i is 2”",
    checkpointLabelOf: "When checkpoint {position} happens",
    checkpointLineOf: "Line {step} sits at",
    checkpointLineNone: "No line",
    moveUpOf: "Move {step} up",
    moveDownOf: "Move {step} down",
    removeCheckpointOf: "Remove {step}",
    answerKeyLabel: "The answers you expect",
    answerKeyHint:
      "The learner's own table, for you to fill in. Leave a cell empty where the value does not exist yet — an empty cell is an answer, and the learner has to leave it empty too.",
    answerKeyEmpty:
      "Add a column and a checkpoint, and the table to fill in appears here.",
    addCheckpoint: "Add a checkpoint",
    noCheckpoints: "No checkpoints yet.",
    unnamedColumn: "Column without a heading",
    unnamedCheckpoint: "Checkpoint {number}",
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
    columnNamePlaceholder: "Überschrift",
    columnNameOf: "Überschrift von Spalte {position}",
    columnKindOf: "Inhalt von {column}",
    moveLeftOf: "{column} nach links",
    moveRightOf: "{column} nach rechts",
    removeColumnOf: "{column} entfernen",
    kindValue: "Ein Wert",
    kindOutput: "Die bisherige Ausgabe",
    kindLine: "Die nächste Zeile",
    addColumn: "Spalte hinzufügen",
    noColumns: "Noch keine Spalten.",
    checkpointsLabel: "Zeitpunkte",
    checkpointsHint:
      "Einer je Moment im Ablauf, in der Reihenfolge des Geschehens. Benenne ihn und gib die Zeile an; die Werte selbst kommen in die Tabelle darunter.",
    checkpointLabelPlaceholder: "„nach der Schleife“, „wenn i gleich 2 ist“",
    checkpointLabelOf: "Wann Zeitpunkt {position} eintritt",
    checkpointLineOf: "Zeile, an der {step} sitzt",
    checkpointLineNone: "Keine Zeile",
    moveUpOf: "{step} nach oben",
    moveDownOf: "{step} nach unten",
    removeCheckpointOf: "{step} entfernen",
    answerKeyLabel: "Die erwarteten Antworten",
    answerKeyHint:
      "Die Tabelle der Lernenden, von dir ausgefüllt. Lass eine Zelle leer, wo es den Wert noch nicht gibt — eine leere Zelle ist eine Antwort, und die Lernenden müssen sie ebenfalls leer lassen.",
    answerKeyEmpty:
      "Füg eine Spalte und einen Zeitpunkt hinzu, dann erscheint hier die Tabelle zum Ausfüllen.",
    addCheckpoint: "Zeitpunkt hinzufügen",
    noCheckpoints: "Noch keine Zeitpunkte.",
    unnamedColumn: "Spalte ohne Überschrift",
    unnamedCheckpoint: "Zeitpunkt {number}",
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
