import type { Catalogs } from "@bitflow/core";

/** What the learner reads. Authoring labels live in `formMessages.ts`. */
export const messages: Catalogs = {
  en: {
    name: "Truth table",
    description:
      "A Boolean expression and its truth table, worked out row by row. Nothing is executed — the expression is walked as a tree.",
    tableLabel: "Truth table",
    howTo: "Set every cell to true or false.",
    howToReadonly: "The table is shown as it was left.",
    inputHeader: "Inputs",
    cellLabel: "{column}, when {inputs}",
    given: "given",
    true: "true",
    false: "false",
    unset: "not set",
    setTrue: "True",
    setFalse: "False",
    correct: "correct",
    wrong: "wrong",
    blank: "left empty",
    andValue: " and ",
    isValue: "{name} is {value}",
  },
  de: {
    name: "Wahrheitstabelle",
    description:
      "Ein boolescher Ausdruck und seine Wahrheitstabelle, Zeile für Zeile. Nichts wird ausgeführt — der Ausdruck wird als Baum durchlaufen.",
    tableLabel: "Wahrheitstabelle",
    howTo: "Setz jede Zelle auf wahr oder falsch.",
    howToReadonly: "Die Tabelle wird so gezeigt, wie sie verlassen wurde.",
    inputHeader: "Eingaben",
    cellLabel: "{column}, wenn {inputs}",
    given: "vorgegeben",
    true: "wahr",
    false: "falsch",
    unset: "nicht gesetzt",
    setTrue: "Wahr",
    setFalse: "Falsch",
    correct: "richtig",
    wrong: "falsch",
    blank: "leer gelassen",
    andValue: " und ",
    isValue: "{name} ist {value}",
  },
};
