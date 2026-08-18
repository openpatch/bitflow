import type { Catalogs } from "@bitflow/core";

export const messages: Catalogs = {
  en: {
    name: "Match up",
    description: "Two columns the learner pairs off.",
    howTo:
      "Choose a card on the left, then the one on the right that goes with it. Choose a matched card again to separate the pair.",
    howToReadonly: "The cards are shown as they were matched.",
    leftHeading: "Choose from these",
    rightHeading: "Match them with these",
    unmatched: "{card}, not matched",
    matchedWith: "{card}, matched with {other}",
    holding: "Holding {card}. Now choose one on the right.",
    putDown: "Put the card back.",
    matched: "{left} matched with {right}.",
    unmatchedNow: "{left} and {right} separated.",
    allMatched: "Every card has been matched.",
    matchRight: "correct",
    matchWrong: "not correct",
  },
  de: {
    name: "Zuordnen (Paare)",
    description: "Zwei Spalten, die paarweise zugeordnet werden.",
    howTo:
      "Wähle links eine Karte und dann rechts die passende. Wähle eine zugeordnete Karte erneut, um das Paar zu trennen.",
    howToReadonly: "Die Karten stehen so, wie sie zugeordnet wurden.",
    leftHeading: "Wähle hieraus",
    rightHeading: "Ordne sie diesen zu",
    unmatched: "{card}, nicht zugeordnet",
    matchedWith: "{card}, zugeordnet zu {other}",
    holding: "{card} aufgenommen. Wähle jetzt rechts eine Karte.",
    putDown: "Karte zurückgelegt.",
    matched: "{left} zu {right} zugeordnet.",
    unmatchedNow: "{left} und {right} getrennt.",
    allMatched: "Alle Karten sind zugeordnet.",
    matchRight: "richtig",
    matchWrong: "nicht richtig",
  },
};
