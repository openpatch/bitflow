import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the grid. Markdown is allowed.",
    wordsLabel: "Words",
    wordsHint:
      "Write the answers and their clues; the grid is laid out for you, and settles into the same shape every time.",
    noWords: "No words yet.",
    unnamedWord: "New word",
    answerLabel: "Answer",
    answerHint: "Letters only. Case and spaces are ignored when marking.",
    clueLabel: "Clue",
    atPlace: "{number} {direction}",
    notPlaced: "not on the grid",
    across: "across",
    down: "down",
    addWord: "Add a word",
    remove: "Remove",
    unplaced:
      "No room for {words} — nothing on the grid shares a letter with them. Change the answer, or add a word that crosses them.",
    previewLabel: "The grid",
    previewHint: "What the learner will fill in, with the answers shown.",
    advanced: "Advanced",
    scoringLabel: "Count",
    scoringHint:
      "By word, an answer is right or it is not. By letter, every correct square counts, which is kinder to a long answer with one slip in it.",
    scoringWords: "One point per word",
    scoringLetters: "One point per letter",
    penaliseLabel: "Take a point off for a wrong letter",
    penaliseHint:
      "An empty square never costs anything, so leaving a clue is never worth more than trying it.",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Gitter angezeigt. Markdown ist erlaubt.",
    wordsLabel: "Wörter",
    wordsHint:
      "Schreib die Antworten und ihre Hinweise; das Gitter wird für dich gelegt und fällt jedes Mal gleich aus.",
    noWords: "Noch keine Wörter.",
    unnamedWord: "Neues Wort",
    answerLabel: "Antwort",
    answerHint: "Nur Buchstaben. Groß- und Kleinschreibung sowie Leerzeichen zählen nicht.",
    clueLabel: "Hinweis",
    atPlace: "{number} {direction}",
    notPlaced: "nicht im Gitter",
    across: "waagerecht",
    down: "senkrecht",
    addWord: "Wort hinzufügen",
    remove: "Entfernen",
    unplaced:
      "Kein Platz für {words} — nichts im Gitter teilt einen Buchstaben mit ihnen. Ändere die Antwort oder füge ein Wort hinzu, das sie kreuzt.",
    previewLabel: "Das Gitter",
    previewHint: "Was die Lernenden ausfüllen, hier mit den Lösungen.",
    advanced: "Erweitert",
    scoringLabel: "Zählung",
    scoringHint:
      "Nach Wort ist eine Antwort richtig oder nicht. Nach Buchstabe zählt jedes richtige Feld, was bei einem langen Wort mit einem Fehler milder ist.",
    scoringWords: "Ein Punkt pro Wort",
    scoringLetters: "Ein Punkt pro Buchstabe",
    penaliseLabel: "Für einen falschen Buchstaben einen Punkt abziehen",
    penaliseHint:
      "Ein leeres Feld kostet nie etwas, damit Auslassen nie mehr wert ist als Versuchen.",
  },
};
