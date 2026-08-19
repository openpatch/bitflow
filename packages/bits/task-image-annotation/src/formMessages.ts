import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint:
      "Markdown is allowed. Say what to mark — the regions are never shown beforehand.",
    imageLabel: "Picture",
    altLabel: "Description of the picture",
    altHint:
      "Read instead of the picture. Say what is in it, not where the answer is.",
    kindLabel: "What the learner places",
    kindPoint: "A point",
    kindRect: "A box they draw",
    countLabel: "How many marks they may place",
    countHint:
      "Usually one per region. More would let them cover the picture and hit everything by accident.",
    requireLabelLabel: "Each mark has to be named as well as placed",
    requireLabelHint:
      "A mark in the right place with the wrong name is reported as exactly that, rather than as a miss.",
    regionsLabel: "Where the answers are",
    regionsHint:
      "Drag on the picture to draw one. These are never shown to the learner until the answer is in.",
    noRegions: "No regions yet. Drag on the picture to draw one.",
    addRegion: "Add a region",
    regionName: "What is here",
    regionNameHint:
      "Shown once the answer is in, and read instead of the picture. Write it for a reader.",
    regionNamePlaceholder: "“the nucleus”",
    regionShape: "Shape",
    shapeCircle: "A spot, with a distance a mark may be out by",
    shapeRect: "An area",
    regionRadius: "How far out a mark may be (% of the width)",
    regionX: "Left (%)",
    regionY: "Top (%)",
    regionWidth: "Width (%)",
    regionHeight: "Height (%)",
    acceptedLabels: "Other names that count",
    acceptedLabelsHint:
      "One per line. The name above always counts, so this is for synonyms.",
    unnamedRegion: "Region without a name",
    removeRegion: "Remove",
    overlapLabel: "How much of a box has to be right (%)",
    overlapHint:
      "Measured as the share of everything the two boxes cover between them, so a box round the whole picture does not count as a box round one thing.",
    penaliseLabel: "A mark that finds nothing costs a point",
    penaliseHint:
      "Off, placing the right marks is already what is rewarded, and charging for a stray one makes the task about caution.",
    caseSensitiveLabel: "Capital letters matter in a name",
    advanced: "Advanced",
    previewHint:
      "The picture as the learner sees it, with the regions drawn. They are not shown to the learner until the answer is in.",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint:
      "Markdown ist erlaubt. Sag, was markiert werden soll — die Bereiche werden vorher nie gezeigt.",
    imageLabel: "Bild",
    altLabel: "Beschreibung des Bildes",
    altHint:
      "Wird statt des Bildes gelesen. Sag, was darauf ist, nicht wo die Antwort liegt.",
    kindLabel: "Was gesetzt wird",
    kindPoint: "Ein Punkt",
    kindRect: "Ein selbst gezogener Kasten",
    countLabel: "Wie viele Markierungen gesetzt werden dürfen",
    countHint:
      "Meist eine je Bereich. Mehr ließe das ganze Bild zupflastern und alles zufällig treffen.",
    requireLabelLabel: "Jede Markierung muss auch benannt werden",
    requireLabelHint:
      "Eine Markierung an der richtigen Stelle mit falschem Namen wird genau so gemeldet und nicht als Fehlschlag.",
    regionsLabel: "Wo die Antworten liegen",
    regionsHint:
      "Zieh im Bild, um einen zu zeichnen. Sie werden erst nach der Abgabe gezeigt.",
    noRegions: "Noch keine Bereiche. Zieh im Bild, um einen zu zeichnen.",
    addRegion: "Bereich hinzufügen",
    regionName: "Was hier ist",
    regionNameHint:
      "Wird nach der Abgabe gezeigt und statt des Bildes gelesen. Schreib es für eine lesende Person.",
    regionNamePlaceholder: "„der Zellkern“",
    regionShape: "Form",
    shapeCircle: "Ein Punkt mit erlaubtem Abstand",
    shapeRect: "Eine Fläche",
    regionRadius: "Erlaubter Abstand (% der Breite)",
    regionX: "Links (%)",
    regionY: "Oben (%)",
    regionWidth: "Breite (%)",
    regionHeight: "Höhe (%)",
    acceptedLabels: "Weitere gültige Namen",
    acceptedLabelsHint:
      "Einer je Zeile. Der Name oben zählt immer, das hier ist für Synonyme.",
    unnamedRegion: "Bereich ohne Namen",
    removeRegion: "Entfernen",
    overlapLabel: "Wie viel eines Kastens stimmen muss (%)",
    overlapHint:
      "Gemessen als Anteil an allem, was beide Kästen zusammen abdecken — ein Kasten um das ganze Bild zählt also nicht als Kasten um eine Sache.",
    penaliseLabel: "Eine Markierung, die nichts trifft, kostet einen Punkt",
    penaliseHint:
      "Aus wird schon belohnt, die richtigen Markierungen zu setzen, und eine Strafe machte die Aufgabe zu einer über Vorsicht.",
    caseSensitiveLabel: "Groß- und Kleinschreibung im Namen beachten",
    advanced: "Erweitert",
    previewHint:
      "Das Bild, wie Lernende es sehen, mit eingezeichneten Bereichen. Ihnen werden die Bereiche erst nach der Abgabe gezeigt.",
  },
};
