import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this task's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Markdown is supported. Say what the learner should place.",
    imageLabel: "Image address",
    imageHint: "A URL the learner's browser can reach.",
    altLabel: "What the image shows",
    altHint:
      "Required. Learners using a screen reader have only this, and the image is the task.",
    itemsLabel: "Labels",
    itemsHint: "What the learner drags onto the image.",
    itemPlaceholder: "Label text",
    addItem: "Add a label",
    removeItem: "Remove",
    zonesLabel: "Regions",
    zonesHint:
      "Where labels can be dropped, as fractions of the image: 0 is the left or top edge, 1 the right or bottom.",
    addZone: "Add a region",
    removeZone: "Remove",
    zoneName: "Name of this region",
    zoneNamePlaceholder: "e.g. Arithmetic logic unit",
    zoneAccepts: "Labels that belong here",
    zoneScore: "Points",
    zoneLeft: "Left",
    zoneTop: "Top",
    zoneWidth: "Width",
    zoneHeight: "Height",
    advanced: "Advanced",
    allowMultipleLabel: "A label may be used in more than one region",
    allowMultipleHint: "Off means each label is placed exactly once.",
    partialCreditLabel: "Give credit for each region that is right",
    noZones: "No regions yet. Add one to say where labels go.",
  },
  de: {
    instructionLabel: "Arbeitsauftrag",
    instructionHint:
      "Markdown wird unterstützt. Sag, was zugeordnet werden soll.",
    imageLabel: "Bildadresse",
    imageHint: "Eine URL, die der Browser der Lernenden erreichen kann.",
    altLabel: "Was das Bild zeigt",
    altHint:
      "Erforderlich. Wer einen Screenreader nutzt, hat nur das — und das Bild ist die Aufgabe.",
    itemsLabel: "Beschriftungen",
    itemsHint: "Was auf das Bild gezogen wird.",
    itemPlaceholder: "Beschriftungstext",
    addItem: "Beschriftung hinzufügen",
    removeItem: "Entfernen",
    zonesLabel: "Bereiche",
    zonesHint:
      "Wohin Beschriftungen gelegt werden können, als Anteil des Bildes: 0 ist der linke bzw. obere Rand, 1 der rechte bzw. untere.",
    addZone: "Bereich hinzufügen",
    removeZone: "Entfernen",
    zoneName: "Name dieses Bereichs",
    zoneNamePlaceholder: "z. B. Rechenwerk",
    zoneAccepts: "Beschriftungen, die hierher gehören",
    zoneScore: "Punkte",
    zoneLeft: "Links",
    zoneTop: "Oben",
    zoneWidth: "Breite",
    zoneHeight: "Höhe",
    advanced: "Erweitert",
    allowMultipleLabel: "Eine Beschriftung darf in mehreren Bereichen liegen",
    allowMultipleHint: "Aus bedeutet: jede Beschriftung wird genau einmal gelegt.",
    partialCreditLabel: "Punkte für jeden richtigen Bereich vergeben",
    noZones: "Noch keine Bereiche. Füge einen hinzu, um Ablageorte festzulegen.",
  },
};
