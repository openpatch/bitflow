import type { Catalogs } from "@bitflow/core";

export const messages: Catalogs = {
  en: {
    name: "Put in order",
    description: "Items the learner arranges into the right order.",
    howTo:
      "Put the items in order. Drag one up or down, or focus one and move it with the arrow keys.",
    howToReadonly: "The items are shown in the order they were left.",
    itemLabel: "{item}, {position} of {total}",
    moved: "{item} moved to {position} of {total}.",
    itemRight: "in the right place",
    itemWrong: "not in the right place",
  },
  de: {
    name: "In die richtige Reihenfolge bringen",
    description: "Elemente, die in die richtige Reihenfolge gebracht werden.",
    howTo:
      "Bring die Elemente in die richtige Reihenfolge. Zieh eines nach oben oder unten, oder wähle es aus und bewege es mit den Pfeiltasten.",
    howToReadonly: "Die Elemente stehen in der zuletzt gewählten Reihenfolge.",
    itemLabel: "{item}, {position} von {total}",
    moved: "{item} auf Platz {position} von {total} bewegt.",
    itemRight: "an der richtigen Stelle",
    itemWrong: "nicht an der richtigen Stelle",
  },
};
