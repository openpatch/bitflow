import type { Catalogs } from "@bitflow/core";

export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what order is being asked for.",
    itemsLabel: "Items, in the right order",
    itemsHint:
      "This is the answer. Learners are given them shuffled, and the shuffle is the same each time they come back.",
    addText: "Add a text item",
    addImage: "Add a picture item",
    noItems: "No items yet.",
    itemKind: "This item is",
    itemText: "Text on this item",
    itemPicture: "Picture",
    itemPictureAltHint:
      "Required, and the item's only name for anyone who cannot see it.",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    advanced: "Advanced",
    unnamedItem: "Unnamed item",
    position: "Position {position}",
  },
  de: {
    instructionLabel: "Arbeitsauftrag",
    instructionHint:
      "Markdown wird unterstützt. Sag, nach welcher Reihenfolge gefragt ist.",
    itemsLabel: "Elemente, in der richtigen Reihenfolge",
    itemsHint:
      "Das ist die Lösung. Lernende bekommen sie gemischt, und die Mischung bleibt bei jeder Rückkehr dieselbe.",
    addText: "Textelement hinzufügen",
    addImage: "Bildelement hinzufügen",
    noItems: "Noch keine Elemente.",
    itemKind: "Dieses Element ist",
    itemText: "Text auf diesem Element",
    itemPicture: "Bild",
    itemPictureAltHint:
      "Erforderlich, und zugleich der einzige Name des Elements für alle, die es nicht sehen.",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    remove: "Entfernen",
    advanced: "Erweitert",
    unnamedItem: "Element ohne Namen",
    position: "Platz {position}",
  },
};
