import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    "placement-adrift": "not on any target",
    pointGained: "one point",
    pointLost: "one point deducted",
    name: "Drag and drop",
    description: "Elements the learner drags to where they belong on a picture.",
    howTo:
      "Drag each element to where it belongs on the picture. It stays where you leave it. With a keyboard: focus an element and move it with the arrow keys — hold Shift for bigger steps, Backspace to send it back.",
    howToReadonly: "The elements are shown where they were left.",
    moved: "{element} moved.",
    returned: "{element} sent back.",
    placedElement: "{element}, {x}% across and {y}% down",
    cloneable: "{element}, can be used more than once",
    "placement-correct": "correct",
    "placement-wrong": "not correct",
  },
  de: {
    "placement-adrift": "auf keinem Ziel",
    pointGained: "ein Punkt",
    pointLost: "ein Punkt abgezogen",
    name: "Zuordnen",
    description: "Elemente, die an die richtige Stelle eines Bildes gezogen werden.",
    howTo:
      "Zieh jedes Element dorthin, wo es hingehört. Es bleibt liegen, wo du es lässt. Mit Tastatur: Element fokussieren und mit den Pfeiltasten bewegen — Umschalt für größere Schritte, Rücktaste zum Zurückschicken.",
    howToReadonly: "Die Elemente stehen dort, wo sie gelassen wurden.",
    moved: "{element} bewegt.",
    returned: "{element} zurückgeschickt.",
    placedElement: "{element}, {x}% von links und {y}% von oben",
    cloneable: "{element}, mehrfach verwendbar",
    "placement-correct": "richtig",
    "placement-wrong": "nicht richtig",
  },
};
