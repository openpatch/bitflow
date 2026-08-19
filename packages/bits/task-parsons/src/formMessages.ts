import type { Catalogs } from "@bitflow/core";

export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what the program should do.",
    languageLabel: "Language",
    languageHint:
      "Recorded so the code reads as code. Nothing highlights it: that would mean a parser per language, and the exercise is about structure.",
    programLabel: "The program, finished",
    programHint:
      "Write or paste it as it should end up, one line per line. This is the answer; learners are given the lines shuffled, and the shuffle is the same each time they come back. Indentation is read off the code — two spaces, four or a tab all count as one step of nesting.",
    programPlaceholder: "def total(values):\n    sum = 0\n    for value in values:\n        sum += value\n    return sum",
    distractorsLabel: "Lines that do not belong",
    distractorsHint:
      "One per line. They are dealt out among the rest, and the learner has to decide what is not part of the answer. Their indentation is never asked for.",
    readAsLabel: "Read as",
    readAsHint:
      "How the program was understood — the level each line sits at. Indentation is the half of the answer that is easiest to lose to a stray space.",
    levelShort: "Level {level}",
    advanced: "Advanced",
    indentationLabel: "Indentation is part of the answer",
    indentationHint:
      "Off, the learner is asked only for the order and cannot change indentation.",
    penaliseLabel: "Using a line that does not belong costs a point",
    penaliseHint:
      "Off, leaving one out is already rewarded by the lines that then land in the right place.",
  },
  de: {
    instructionLabel: "Arbeitsauftrag",
    instructionHint:
      "Markdown wird unterstützt. Sag, was das Programm tun soll.",
    languageLabel: "Sprache",
    languageHint:
      "Wird festgehalten, damit Code als Code gelesen wird. Hervorgehoben wird nichts: das bräuchte einen Parser je Sprache, und es geht um die Struktur.",
    programLabel: "Das fertige Programm",
    programHint:
      "Schreib oder füg es so ein, wie es am Ende aussehen soll — eine Zeile je Zeile. Das ist die Lösung; Lernende bekommen die Zeilen gemischt, und die Mischung bleibt bei jeder Rückkehr dieselbe. Die Einrückung wird aus dem Code gelesen: zwei Leerzeichen, vier oder ein Tab zählen gleichermaßen als eine Stufe.",
    programPlaceholder: "def summe(werte):\n    summe = 0\n    for wert in werte:\n        summe += wert\n    return summe",
    distractorsLabel: "Zeilen, die nicht dazugehören",
    distractorsHint:
      "Eine je Zeile. Sie werden unter die übrigen gemischt, und die Lernenden müssen entscheiden, was nicht zur Lösung gehört. Nach ihrer Einrückung wird nie gefragt.",
    readAsLabel: "So verstanden",
    readAsHint:
      "Wie das Programm gelesen wurde — auf welcher Stufe jede Zeile sitzt. Die Einrückung ist der Teil der Lösung, den ein verirrtes Leerzeichen am leichtesten kippt.",
    levelShort: "Stufe {level}",
    advanced: "Erweitert",
    indentationLabel: "Einrückung gehört zur Lösung",
    indentationHint:
      "Aus wird nur nach der Reihenfolge gefragt, und die Einrückung ist nicht änderbar.",
    penaliseLabel: "Eine Zeile zu verwenden, die nicht dazugehört, kostet einen Punkt",
    penaliseHint:
      "Aus wird das Weglassen schon dadurch belohnt, dass die übrigen Zeilen dann richtig liegen.",
  },
};
