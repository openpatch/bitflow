import type { Catalogs } from "@bitflow/core";

export const messages: Catalogs = {
  en: {
    name: "Match up",
    description: "Two columns the learner pairs off.",
    howTo:
      "Choose a card from the first list, then the one from the second list that goes with it. Choose a matched card again to separate the pair.",
    howToReadonly: "The cards are shown as they were matched.",
    leftHeading: "Choose from these",
    rightHeading: "Match them with these",
    unmatched: "{card}, not matched",
    matchedWith: "{card}, matched with {other}",
    holding: "Holding {card}. Now choose one from the second list.",
    // The visible line a held card leaves behind, sticky at the bottom of the
    // page. It says the same thing the live region above already announces —
    // it is `aria-hidden` for that reason — so the wording is free to read
    // well printed rather than match the announcement word for word.
    holdingStatus: "Holding: {card} — now choose its partner.",
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
      "Wähle eine Karte aus der ersten Liste und dann die passende aus der zweiten. Wähle eine zugeordnete Karte erneut, um das Paar zu trennen.",
    howToReadonly: "Die Karten stehen so, wie sie zugeordnet wurden.",
    leftHeading: "Wähle hieraus",
    rightHeading: "Ordne sie diesen zu",
    unmatched: "{card}, nicht zugeordnet",
    matchedWith: "{card}, zugeordnet zu {other}",
    holding: "{card} aufgenommen. Wähle jetzt eine Karte aus der zweiten Liste.",
    holdingStatus: "Ausgewählt: {card} — wähle jetzt die passende Karte.",
    putDown: "Karte zurückgelegt.",
    matched: "{left} zu {right} zugeordnet.",
    unmatchedNow: "{left} und {right} getrennt.",
    allMatched: "Alle Karten sind zugeordnet.",
    matchRight: "richtig",
    matchWrong: "nicht richtig",
  },
};
