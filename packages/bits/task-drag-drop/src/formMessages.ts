import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this task's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    zoneTolerance: "Counts as on this region when",
    zoneToleranceHint:
      "Touching is what aiming at a target feels like. The stricter rules are for tasks where placing precisely is the point.",
    toleranceTouch: "The element touches it at all",
    toleranceCentre: "The element's middle is inside it",
    toleranceFit: "The element is inside it completely",
    zoneUnnamed: "Unnamed region",
    zoneExpectsShort: "Expects",
    zoneExpectsNothing: "Nothing belongs here yet",
    elementUnnamed: "Unnamed element",
    elementBelongsIn: "Belongs in",
    elementBelongsNowhere: "A distractor — belongs nowhere",
    elementKind: "This element is",
    elementKindText: "Text",
    elementKindImage: "A picture",
    elementPicture: "Picture on this element",
    elementPictureAltHint:
      "Required, and what the element is announced as. Learners using a screen reader have only this.",
    canvasHint:
      "Drag on the picture to draw a drop zone. Drag a box to move it, or its corner to resize. The numbers below do the same thing.",
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what the learner should do.",
    imageLabel: "Background picture",
    imageHint:
      "Stored inside the assessment, so it travels with the file. It is scaled down and re-encoded when you choose it.",
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
    zoneExpectsNoElements: "Nothing to expect yet — add an element below, and it can be asked for here.",
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
    zoneTolerance: "Gilt als auf diesem Bereich, wenn",
    zoneToleranceHint:
      "„Berührt“ entspricht dem Gefühl, ein Ziel zu treffen. Die strengeren Regeln sind für Aufgaben, bei denen genaues Platzieren das Thema ist.",
    toleranceTouch: "das Element ihn überhaupt berührt",
    toleranceCentre: "die Mitte des Elements darin liegt",
    toleranceFit: "das Element vollständig darin liegt",
    zoneUnnamed: "Bereich ohne Namen",
    zoneExpectsShort: "Erwartet",
    zoneExpectsNothing: "Hier gehört noch nichts hin",
    elementUnnamed: "Element ohne Namen",
    elementBelongsIn: "Gehört in",
    elementBelongsNowhere: "Ablenker — gehört nirgendwohin",
    elementKind: "Dieses Element ist",
    elementKindText: "Text",
    elementKindImage: "Ein Bild",
    elementPicture: "Bild auf diesem Element",
    elementPictureAltHint:
      "Erforderlich, und zugleich der angesagte Name des Elements. Wer einen Screenreader nutzt, hat nur das.",
    canvasHint:
      "Zieh auf dem Bild, um einen Ablagebereich zu zeichnen. Zieh ein Kästchen zum Verschieben oder seine Ecke zum Ändern der Größe. Die Zahlen darunter tun dasselbe.",
    instructionLabel: "Arbeitsauftrag",
    instructionHint: "Markdown wird unterstützt. Sag, was zu tun ist.",
    imageLabel: "Hintergrundbild",
    imageHint:
      "Wird im Test gespeichert und wandert mit der Datei mit. Beim Auswählen wird es verkleinert und neu kodiert.",
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
    zoneExpectsNoElements: "Noch nichts zu erwarten — füg unten ein Element hinzu, dann kann es hier verlangt werden.",
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
