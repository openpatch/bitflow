import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this task's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    canvasHint:
      "Drag on the picture to draw a drop zone. Drag a box to move it, or its corner to resize. The numbers below do the same thing.",
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what the learner should do.",
    imageLabel: "Background image address",
    imageHint: "A URL the learner's browser can reach.",
    altLabel: "What the image shows",
    altHint:
      "Required. Learners using a screen reader have only this, and the image is the task.",
    sizeLabel: "Shape of the play area",
    sizeHint: "Only the ratio matters. Everything on it is positioned in fractions.",
    sizeWidth: "Width",
    sizeHeight: "Height",
    elementsLabel: "Elements",
    elementsHint:
      "What the learner moves. Positions are fractions of the play area: 0 is the left or top edge, 1 the right or bottom.",
    addElement: "Add an element",
    elementText: "Text on this element",
    elementMultiple: "Can be used more than once",
    elementMultipleHint: "Leaves a copy behind, so it can fill several zones.",
    zonesLabel: "Drop zones",
    zonesHint:
      "Invisible to the learner: a region is only used to work out whether what was left on it belongs there. Draw one on the picture above.",
    addZone: "Add a drop zone",
    zoneName: "Name of this zone",
    zoneNamePlaceholder: "e.g. Arithmetic logic unit",
    zoneExpects: "Elements that belong here",
    zoneTip: "Hint, shown on hover before checking",
    zoneFeedbackCorrect: "Feedback when right",
    zoneFeedbackIncorrect: "Feedback when wrong",
    left: "Left",
    top: "Top",
    width: "Width",
    height: "Height",
    opacity: "Opacity",
    remove: "Remove",
    advanced: "Advanced",
    singlePointLabel: "The whole task is worth one point",
    singlePointHint: "Off gives a point for each element in the right place.",
    applyPenaltiesLabel: "An element in the wrong zone costs a point",
    applyPenaltiesHint:
      "Without this, dropping everything everywhere scores full marks.",
    noElements: "No elements yet.",
    noZones: "No drop zones yet.",
  },
  de: {
    canvasHint:
      "Zieh auf dem Bild, um einen Ablagebereich zu zeichnen. Zieh ein Kästchen zum Verschieben oder seine Ecke zum Ändern der Größe. Die Zahlen darunter tun dasselbe.",
    instructionLabel: "Arbeitsauftrag",
    instructionHint: "Markdown wird unterstützt. Sag, was zu tun ist.",
    imageLabel: "Adresse des Hintergrundbilds",
    imageHint: "Eine URL, die der Browser der Lernenden erreichen kann.",
    altLabel: "Was das Bild zeigt",
    altHint:
      "Erforderlich. Wer einen Screenreader nutzt, hat nur das — und das Bild ist die Aufgabe.",
    sizeLabel: "Form der Spielfläche",
    sizeHint:
      "Nur das Verhältnis zählt. Alles darauf wird in Anteilen positioniert.",
    sizeWidth: "Breite",
    sizeHeight: "Höhe",
    elementsLabel: "Elemente",
    elementsHint:
      "Was bewegt wird. Positionen sind Anteile der Spielfläche: 0 ist der linke bzw. obere Rand, 1 der rechte bzw. untere.",
    addElement: "Element hinzufügen",
    elementText: "Text auf diesem Element",
    elementMultiple: "Mehrfach verwendbar",
    elementMultipleHint:
      "Lässt eine Kopie zurück, sodass mehrere Bereiche gefüllt werden können.",
    zonesLabel: "Ablagebereiche",
    zonesHint:
      "Für Lernende unsichtbar: ein Bereich dient nur dazu, zu prüfen, ob das Abgelegte dorthin gehört. Zeichne einen im Bild oben.",
    addZone: "Ablagebereich hinzufügen",
    zoneName: "Name dieses Bereichs",
    zoneNamePlaceholder: "z. B. Rechenwerk",
    zoneExpects: "Elemente, die hierher gehören",
    zoneTip: "Hinweis, beim Überfahren vor dem Prüfen",
    zoneFeedbackCorrect: "Rückmeldung bei richtig",
    zoneFeedbackIncorrect: "Rückmeldung bei falsch",
    left: "Links",
    top: "Oben",
    width: "Breite",
    height: "Höhe",
    opacity: "Deckkraft",
    remove: "Entfernen",
    advanced: "Erweitert",
    singlePointLabel: "Die ganze Aufgabe zählt einen Punkt",
    singlePointHint:
      "Aus vergibt einen Punkt pro Element am richtigen Platz.",
    applyPenaltiesLabel: "Ein Element im falschen Bereich kostet einen Punkt",
    applyPenaltiesHint:
      "Ohne das bringt „alles überall ablegen“ die volle Punktzahl.",
    noElements: "Noch keine Elemente.",
    noZones: "Noch keine Ablagebereiche.",
  },
};
