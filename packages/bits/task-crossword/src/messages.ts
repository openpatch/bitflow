import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Crossword",
    description: "A grid the learner fills in from across and down clues.",
    howTo:
      "Click a square and type. Click it again to switch between across and down; the arrow keys do the same. You can also type a whole answer into the box beside its clue.",
    howToReadonly: "The grid is shown as it was left.",
    empty: "This crossword has no words yet.",
    gridLabel: "Crossword grid",
    across: "Across",
    down: "Down",
    cellAt: "Row {row}, column {column}",
    cellIn: "{number} {direction}, {clue}, letter {position} of {letters}",
    wordLabel: "{number} {direction}, {clue}, {letters} letters",
    clueRight: "correct",
    clueWrong: "not correct",
    clueUnfinished: "not finished",
  },
  de: {
    name: "Kreuzworträtsel",
    description: "Ein Gitter, das aus waagerechten und senkrechten Hinweisen gefüllt wird.",
    howTo:
      "Klick ein Feld an und tippe. Ein zweiter Klick wechselt zwischen waagerecht und senkrecht; die Pfeiltasten tun dasselbe. Du kannst eine Antwort auch als Ganzes in das Feld neben dem Hinweis schreiben.",
    howToReadonly: "Das Gitter steht so, wie es gelassen wurde.",
    empty: "Dieses Kreuzworträtsel hat noch keine Wörter.",
    gridLabel: "Kreuzworträtsel",
    across: "Waagerecht",
    down: "Senkrecht",
    cellAt: "Zeile {row}, Spalte {column}",
    cellIn: "{number} {direction}, {clue}, Buchstabe {position} von {letters}",
    wordLabel: "{number} {direction}, {clue}, {letters} Buchstaben",
    clueRight: "richtig",
    clueWrong: "nicht richtig",
    clueUnfinished: "nicht fertig",
  },
};
