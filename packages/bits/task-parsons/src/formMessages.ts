import type { Catalogs } from "@bitflow/core";

export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what the program should do.",
    languageLabel: "Language",
    languageHint:
      "Recorded so the code reads as code. Nothing highlights it: that would mean a parser per language, and the exercise is about structure.",
    linesLabel: "Lines, in the order they belong",
    linesHint:
      "This is the answer. Learners are given them shuffled, and the shuffle is the same each time they come back.",
    addLine: "Add a line",
    addDistractor: "Add a line that does not belong",
    noLines: "No lines yet.",
    lineText: "The code on this line",
    lineIndent: "Indentation, in steps",
    lineDistractor: "This line does not belong in the program",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    advanced: "Advanced",
    indentationLabel: "Indentation is part of the answer",
    indentationHint:
      "Off, the learner is asked only for the order and cannot change indentation.",
    penaliseLabel: "Using a line that does not belong costs a point",
    penaliseHint:
      "Off, leaving one out is already rewarded by the lines that then land in the right place.",
    unnamedLine: "Empty line",
    isDistractor: "Does not belong",
    atIndent: "Indented {indent}",
  },
  de: {
    instructionLabel: "Arbeitsauftrag",
    instructionHint:
      "Markdown wird unterstützt. Sag, was das Programm tun soll.",
    languageLabel: "Sprache",
    languageHint:
      "Wird festgehalten, damit Code als Code gelesen wird. Hervorgehoben wird nichts: das bräuchte einen Parser je Sprache, und es geht um die Struktur.",
    linesLabel: "Zeilen, in der richtigen Reihenfolge",
    linesHint:
      "Das ist die Lösung. Lernende bekommen sie gemischt, und die Mischung bleibt bei jeder Rückkehr dieselbe.",
    addLine: "Zeile hinzufügen",
    addDistractor: "Zeile hinzufügen, die nicht dazugehört",
    noLines: "Noch keine Zeilen.",
    lineText: "Der Code dieser Zeile",
    lineIndent: "Einrückung, in Stufen",
    lineDistractor: "Diese Zeile gehört nicht ins Programm",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    remove: "Entfernen",
    advanced: "Erweitert",
    indentationLabel: "Einrückung gehört zur Lösung",
    indentationHint:
      "Aus wird nur nach der Reihenfolge gefragt, und die Einrückung ist nicht änderbar.",
    penaliseLabel: "Eine Zeile zu verwenden, die nicht dazugehört, kostet einen Punkt",
    penaliseHint:
      "Aus wird das Weglassen schon dadurch belohnt, dass die übrigen Zeilen dann richtig liegen.",
    unnamedLine: "Leere Zeile",
    isDistractor: "Gehört nicht dazu",
    atIndent: "{indent} eingerückt",
  },
};
