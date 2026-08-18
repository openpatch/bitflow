import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this task's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Question",
    instructionHint: "Markdown is supported. Say what the learner should find.",
    backgroundLabel: "Picture",
    canvasHint:
      "Drag on the picture to draw a region. Drag a region to move it, or its corner to resize. The numbers below do the same thing.",
    regionsLabel: "Regions",
    regionsHint:
      "Never shown to the learner. Mark the one to find, and add the wrong ones worth catching.",
    addRect: "Add a rectangle",
    addEllipse: "Add an ellipse",
    noRegions: "No regions yet. Draw one on the picture.",
    regionName: "Name of this region",
    regionNameHint:
      "Never shown. It describes the region to someone who cannot see the picture, and names it in the report.",
    regionNamePlaceholder: "e.g. The keyboard",
    regionShape: "Shape",
    shapeRect: "Rectangle",
    shapeEllipse: "Ellipse",
    regionCorrect: "This is the one to find",
    regionFeedback: "What to say when this is chosen",
    regionFeedbackHint:
      "On a wrong region this is where the teaching happens — better than a red cross.",
    missFeedback: "What to say when the learner picks bare picture",
    left: "Left",
    top: "Top",
    width: "Width",
    height: "Height",
    remove: "Remove",
    advanced: "Advanced",
    unnamedRegion: "Unnamed region",
    isCorrect: "The one to find",
    isDecoy: "A wrong one",
  },
  de: {
    instructionLabel: "Frage",
    instructionHint:
      "Markdown wird unterstützt. Sag, was gefunden werden soll.",
    backgroundLabel: "Bild",
    canvasHint:
      "Zieh auf dem Bild, um einen Bereich zu zeichnen. Zieh einen Bereich zum Verschieben oder seine Ecke zum Ändern der Größe. Die Zahlen darunter tun dasselbe.",
    regionsLabel: "Bereiche",
    regionsHint:
      "Für Lernende nie sichtbar. Markiere den gesuchten und füge die falschen hinzu, die sich zu erfassen lohnen.",
    addRect: "Rechteck hinzufügen",
    addEllipse: "Ellipse hinzufügen",
    noRegions: "Noch keine Bereiche. Zeichne einen auf dem Bild.",
    regionName: "Name dieses Bereichs",
    regionNameHint:
      "Wird nie angezeigt. Er beschreibt den Bereich für alle, die das Bild nicht sehen, und benennt ihn im Bericht.",
    regionNamePlaceholder: "z. B. Die Tastatur",
    regionShape: "Form",
    shapeRect: "Rechteck",
    shapeEllipse: "Ellipse",
    regionCorrect: "Das ist der gesuchte Bereich",
    regionFeedback: "Was gesagt wird, wenn dieser gewählt wird",
    regionFeedbackHint:
      "Bei einem falschen Bereich passiert hier das Lernen — besser als ein rotes Kreuz.",
    missFeedback: "Was gesagt wird, wenn eine leere Stelle gewählt wird",
    left: "Links",
    top: "Oben",
    width: "Breite",
    height: "Höhe",
    remove: "Entfernen",
    advanced: "Erweitert",
    unnamedRegion: "Bereich ohne Namen",
    isCorrect: "Der gesuchte",
    isDecoy: "Ein falscher",
  },
};
