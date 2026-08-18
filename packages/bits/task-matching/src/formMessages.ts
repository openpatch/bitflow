import type { Catalogs } from "@bitflow/core";

export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what goes with what.",
    pairsLabel: "Pairs",
    pairsHint:
      "This is the answer. Learners are given the two columns shuffled, and the shuffle is the same each time they come back.",
    addPair: "Add a pair",
    noPairs: "No pairs yet.",
    leftLabel: "Left card",
    rightLabel: "Right card",
    kind: "This card is",
    kindText: "Text",
    kindImage: "A picture",
    cardText: "Text on this card",
    cardPicture: "Picture",
    cardPictureAltHint:
      "Required, and the card's only name for anyone who cannot see it.",
    remove: "Remove",
    advanced: "Advanced",
    unnamedPair: "Empty pair",
    pairSummary: "{left} → {right}",
  },
  de: {
    instructionLabel: "Arbeitsauftrag",
    instructionHint: "Markdown wird unterstützt. Sag, was zu was gehört.",
    pairsLabel: "Paare",
    pairsHint:
      "Das ist die Lösung. Lernende bekommen die beiden Spalten gemischt, und die Mischung bleibt bei jeder Rückkehr dieselbe.",
    addPair: "Paar hinzufügen",
    noPairs: "Noch keine Paare.",
    leftLabel: "Linke Karte",
    rightLabel: "Rechte Karte",
    kind: "Diese Karte ist",
    kindText: "Text",
    kindImage: "Ein Bild",
    cardText: "Text auf dieser Karte",
    cardPicture: "Bild",
    cardPictureAltHint:
      "Erforderlich, und zugleich der einzige Name der Karte für alle, die sie nicht sehen.",
    remove: "Entfernen",
    advanced: "Erweitert",
    unnamedPair: "Leeres Paar",
    pairSummary: "{left} → {right}",
  },
};
