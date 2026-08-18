import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Find the spot",
    description: "A picture with a place on it the learner has to find.",
    howTo:
      "Choose the place in the picture the question asks about. With a keyboard: move the crosshair with the arrow keys — hold Shift for bigger steps — and press Enter to choose.",
    howToReadonly: "The chosen spot is marked.",
    pictureLabel: "{alt}. Aiming at {x}% across and {y}% down.",
    aiming: "Aiming at {x}% across and {y}% down.",
    chose: "Chose {x}% across and {y}% down.",
    landedOn: "You chose: {region}.",
    landedNowhere: "You chose a part of the picture with nothing on it.",
  },
  de: {
    name: "Stelle finden",
    description: "Ein Bild mit einer Stelle, die gefunden werden soll.",
    howTo:
      "Wähle die Stelle im Bild, nach der gefragt wird. Mit Tastatur: das Fadenkreuz mit den Pfeiltasten bewegen — Umschalt für größere Schritte — und mit Enter wählen.",
    howToReadonly: "Die gewählte Stelle ist markiert.",
    pictureLabel: "{alt}. Zielt auf {x}% von links und {y}% von oben.",
    aiming: "Zielt auf {x}% von links und {y}% von oben.",
    chose: "{x}% von links und {y}% von oben gewählt.",
    landedOn: "Gewählt: {region}.",
    landedNowhere: "Du hast eine Stelle ohne Bereich gewählt.",
  },
};
