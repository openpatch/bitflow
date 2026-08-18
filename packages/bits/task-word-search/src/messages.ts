import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Find the words",
    description: "A letter grid with words hidden in it for the learner to find.",
    howTo:
      "Draw along a word: press on its first letter and pull to its last. Words run in any of the eight directions, forwards or backwards. With a keyboard: move with the arrow keys, press Enter on the first letter, then Enter again on the last.",
    howToReadonly: "The grid is shown as it was left.",
    gridLabel: "Letter grid",
    cellAt: "{letter}, row {row}, column {column}",
    partOf: "part of {word}",
    wordsHeading: "Found {found} of {total}",
    hiddenWords: "There are {total} words hidden in the grid.",
    isFound: "found",
    notFound: "not found yet",
    missed: "not found",
    wordFound: "{word} found. {found} of {total}.",
    alreadyFound: "{word} was already found.",
    nothingThere: "No word there.",
    runStarted: "Started at row {row}, column {column}. Move to the last letter and press Enter.",
    runCancelled: "Cancelled.",
  },
  de: {
    name: "Wörter finden",
    description: "Ein Buchstabengitter mit versteckten Wörtern.",
    howTo:
      "Zieh über ein Wort: auf dem ersten Buchstaben drücken und bis zum letzten ziehen. Wörter verlaufen in allen acht Richtungen, vorwärts wie rückwärts. Mit Tastatur: mit den Pfeiltasten bewegen, auf dem ersten Buchstaben Enter drücken, dann auf dem letzten noch einmal.",
    howToReadonly: "Das Gitter steht so, wie es gelassen wurde.",
    gridLabel: "Buchstabengitter",
    cellAt: "{letter}, Zeile {row}, Spalte {column}",
    partOf: "gehört zu {word}",
    wordsHeading: "{found} von {total} gefunden",
    hiddenWords: "Im Gitter sind {total} Wörter versteckt.",
    isFound: "gefunden",
    notFound: "noch nicht gefunden",
    missed: "nicht gefunden",
    wordFound: "{word} gefunden. {found} von {total}.",
    alreadyFound: "{word} war schon gefunden.",
    nothingThere: "Dort ist kein Wort.",
    runStarted: "Start bei Zeile {row}, Spalte {column}. Zum letzten Buchstaben gehen und Enter drücken.",
    runCancelled: "Abgebrochen.",
  },
};
