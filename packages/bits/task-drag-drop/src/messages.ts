import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Drag and drop",
    description: "Labels the learner puts onto regions of an image.",
    howTo:
      "Choose a label, then choose the region it belongs to. Choose a filled region again to take its label back.",
    howToReadonly: "The labels are shown where they were placed.",
    holding: "Holding {item}. Now choose a region.",
    putDown: "Put the label back.",
    placed: "{item} placed on {zone}.",
    removed: "{item} taken back from {zone}.",
    emptyZone: "{zone}, empty",
    filledZone: "{zone}, holding {items}",
    trayEmpty: "Every label has been placed.",
    "zone-correct": "correct",
    "zone-wrong": "not correct",
    "zone-empty": "left empty",
  },
  de: {
    name: "Zuordnen",
    description: "Beschriftungen, die auf Bereiche eines Bildes gelegt werden.",
    howTo:
      "Wähle eine Beschriftung und dann den Bereich, in den sie gehört. Wähle einen belegten Bereich erneut, um die Beschriftung zurückzunehmen.",
    howToReadonly: "Die Beschriftungen stehen dort, wo sie abgelegt wurden.",
    holding: "{item} aufgenommen. Wähle jetzt einen Bereich.",
    putDown: "Beschriftung zurückgelegt.",
    placed: "{item} auf {zone} abgelegt.",
    removed: "{item} von {zone} zurückgenommen.",
    emptyZone: "{zone}, leer",
    filledZone: "{zone}, enthält {items}",
    trayEmpty: "Alle Beschriftungen sind abgelegt.",
    "zone-correct": "richtig",
    "zone-wrong": "nicht richtig",
    "zone-empty": "leer gelassen",
  },
};
