import type { Catalogs } from "@bitflow/core";

/** What the learner reads. Authoring labels live in `formMessages.ts`. */
export const messages: Catalogs = {
  en: {
    name: "Mark the picture",
    description:
      "The learner places their own marks on an image, and where they landed is the answer.",
    surfacePoint:
      "{alt}. Aiming at {x}% across and {y}% down. {placed} of {total} mark(s) placed. Arrow keys move the aim, Enter places a mark.",
    surfaceRect:
      "{alt}. Aiming at {x}% across and {y}% down. {placed} of {total} box(es) placed. Arrow keys move the aim, Enter sets the first corner.",
    surfaceCorner:
      "{alt}. First corner set. Aiming at {x}% across and {y}% down. Enter finishes the box, Escape starts it over.",
    helpPoint:
      "Click the picture, or move the aim with the arrow keys and press Enter. Hold Shift to move further at a time.",
    helpRect:
      "Drag a box on the picture, or move the aim with the arrow keys and press Enter twice — once for each corner. Hold Shift to move further at a time.",
    placed: "Mark {number} placed at {x}% across, {y}% down.",
    removed: "Mark {number} removed.",
    cornerSet: "First corner at {x}% across, {y}% down. Enter again to finish the box.",
    cornerCancelled: "First corner cleared.",
    nothingPlaced: "Nothing marked yet.",
    markPoint: "Mark {number}: {x}% across, {y}% down",
    markBox: "Box {number}: {x}% across, {y}% down, {width}% wide, {height}% tall",
    removeMark: "Remove mark {number}",
    nameOf: "Name for mark {number}",
    namePlaceholder: "What is it?",
    verdictRight: "{label}",
    verdictNamedWrong: "In the right place — this is the {label}",
    verdictStray: "Nothing here",
    missed: "Not marked: {label}",
  },
  de: {
    name: "Im Bild markieren",
    description:
      "Lernende setzen eigene Markierungen ins Bild, und wo sie landen, ist die Antwort.",
    surfacePoint:
      "{alt}. Zielt auf {x} % von links und {y} % von oben. {placed} von {total} Markierung(en) gesetzt. Pfeiltasten bewegen das Ziel, Enter setzt eine Markierung.",
    surfaceRect:
      "{alt}. Zielt auf {x} % von links und {y} % von oben. {placed} von {total} Kasten/Kästen gesetzt. Pfeiltasten bewegen das Ziel, Enter setzt die erste Ecke.",
    surfaceCorner:
      "{alt}. Erste Ecke gesetzt. Zielt auf {x} % von links und {y} % von oben. Enter schließt den Kasten ab, Escape beginnt von vorn.",
    helpPoint:
      "Klick ins Bild, oder bewege das Ziel mit den Pfeiltasten und drück Enter. Mit Shift geht es in größeren Schritten.",
    helpRect:
      "Zieh einen Kasten im Bild auf, oder bewege das Ziel mit den Pfeiltasten und drück zweimal Enter — einmal je Ecke. Mit Shift geht es in größeren Schritten.",
    placed: "Markierung {number} gesetzt bei {x} % von links, {y} % von oben.",
    removed: "Markierung {number} entfernt.",
    cornerSet:
      "Erste Ecke bei {x} % von links, {y} % von oben. Noch einmal Enter schließt den Kasten ab.",
    cornerCancelled: "Erste Ecke gelöscht.",
    nothingPlaced: "Noch nichts markiert.",
    markPoint: "Markierung {number}: {x} % von links, {y} % von oben",
    markBox:
      "Kasten {number}: {x} % von links, {y} % von oben, {width} % breit, {height} % hoch",
    removeMark: "Markierung {number} entfernen",
    nameOf: "Name für Markierung {number}",
    namePlaceholder: "Was ist das?",
    verdictRight: "{label}",
    verdictNamedWrong: "An der richtigen Stelle — das ist {label}",
    verdictStray: "Hier ist nichts",
    missed: "Nicht markiert: {label}",
  },
};
