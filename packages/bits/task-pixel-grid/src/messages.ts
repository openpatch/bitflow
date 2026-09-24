import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the grid's own labels. The authoring form's
 * labels live in `formMessages.ts`, so each catalog can be complete in the
 * languages it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Pixel grid",
    description:
      "A grid the learner paints from a palette, marked cell by cell against the picture.",
    howTo:
      "Choose a colour, then tap or drag across the grid to paint it. Locked cells are already filled in and cannot be changed.",
    howToReadonly: "The grid is shown as it was left.",
    gridLabel: "Pixel grid",
    cellAt: "{color}, row {row}, column {column}",
    given: "locked",
    wrong: "wrong",
    pickColor: "Choose a colour",
    selectedColor: "Selected colour: {color}",
    colorFallback: "Colour {number}",
    clear: "Clear",
  },
  de: {
    name: "Pixelraster",
    description:
      "Ein Raster, das mit einer Palette bemalt wird und Zelle für Zelle mit dem Bild verglichen wird.",
    howTo:
      "Wähle eine Farbe, tippe dann auf das Raster oder ziehe darüber, um zu malen. Gesperrte Zellen sind bereits ausgefüllt und können nicht geändert werden.",
    howToReadonly: "Das Raster steht so, wie es gelassen wurde.",
    gridLabel: "Pixelraster",
    cellAt: "{color}, Zeile {row}, Spalte {column}",
    given: "gesperrt",
    wrong: "falsch",
    pickColor: "Farbe wählen",
    selectedColor: "Gewählte Farbe: {color}",
    colorFallback: "Farbe {number}",
    clear: "Leeren",
  },
};
