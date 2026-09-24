import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint:
      "Shown above the grid. Markdown is allowed — a PBM listing reads well in a code block.",
    sizeLabel: "Grid size",
    sizeHint: "Resizing keeps whatever picture is already painted.",
    rowsLabel: "Rows",
    columnsLabel: "Columns",
    importSummary: "Import a PBM listing",
    importHint:
      'Paste a PBM "P1" listing — the header "P1", then the width and height, then the 0s and 1s. This replaces the size, the palette and the picture with white and black.',
    importTextareaLabel: "PBM text",
    importButton: "Import",
    paletteLabel: "Palette",
    paletteHint: "The colours the learner can paint with.",
    colorSwatchOf: "Colour {position}",
    colorLabelOf: "Label for colour {position}",
    colorLabelPlaceholder: "What this colour means",
    removeColorOf: "Remove colour {position}",
    addColor: "Add a colour",
    unnamedColor: "Colour {number}",
    targetLabel: "The picture",
    targetHint: "Paint the picture the learner has to match.",
    markGivenLabel: "Mark cells as given",
    markGivenHint:
      "While on, painting a cell locks or unlocks it instead of changing its colour. A locked cell starts filled in for the learner and cannot be repainted.",
    markGivenHowTo: "Tap or drag cells to lock or unlock them.",
    startColorLabel: "Starting colour",
    startColorHint: "What every unlocked cell looks like before the learner paints it.",
    showCoordinatesLabel: "Show row and column numbers",
    showCoordinatesHint: "Along the edges of the grid.",
    showLabelsLabel: "Show colour labels in the cells",
    showLabelsHint:
      'Useful for a PBM grid of 0s and 1s, where the colour alone is easy to misread.',
    partialCreditLabel: "Give partial credit",
    partialCreditHint:
      "A point per correct cell instead of one for the whole picture. A grid wrong in one corner got everything else right.",
    advanced: "Advanced",
    pbmNoMagic: 'A PBM listing starts with "P1".',
    pbmBadSize: "The header after P1 needs a width and a height, both whole numbers above 0.",
    pbmCount:
      "A {columns} by {rows} picture needs {expected} values, but the listing has {found}.",
    pbmBadValue: 'Only 0 and 1 belong in a PBM listing, not "{value}".',
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint:
      "Wird über dem Raster angezeigt. Markdown ist erlaubt — eine PBM-Liste liest sich gut in einem Codeblock.",
    sizeLabel: "Rastergröße",
    sizeHint: "Beim Ändern der Größe bleibt das bereits gemalte Bild erhalten.",
    rowsLabel: "Zeilen",
    columnsLabel: "Spalten",
    importSummary: "PBM-Liste importieren",
    importHint:
      'Füge eine PBM-„P1“-Liste ein — den Kopf „P1“, dann Breite und Höhe, dann die Nullen und Einsen. Das ersetzt Größe, Palette und Bild durch Weiß und Schwarz.',
    importTextareaLabel: "PBM-Text",
    importButton: "Importieren",
    paletteLabel: "Palette",
    paletteHint: "Die Farben, mit denen gemalt werden kann.",
    colorSwatchOf: "Farbe {position}",
    colorLabelOf: "Beschriftung für Farbe {position}",
    colorLabelPlaceholder: "Was diese Farbe bedeutet",
    removeColorOf: "Farbe {position} entfernen",
    addColor: "Farbe hinzufügen",
    unnamedColor: "Farbe {number}",
    targetLabel: "Das Bild",
    targetHint: "Male das Bild, das die Lernenden treffen müssen.",
    markGivenLabel: "Zellen als vorgegeben markieren",
    markGivenHint:
      "Solange aktiv, sperrt oder entsperrt das Malen einer Zelle sie, statt ihre Farbe zu ändern. Eine gesperrte Zelle ist für die Lernenden schon ausgefüllt und kann nicht übermalt werden.",
    markGivenHowTo: "Tippe auf Zellen oder ziehe darüber, um sie zu sperren oder zu entsperren.",
    startColorLabel: "Startfarbe",
    startColorHint: "Wie jede ungesperrte Zelle aussieht, bevor sie bemalt wird.",
    showCoordinatesLabel: "Zeilen- und Spaltennummern anzeigen",
    showCoordinatesHint: "An den Rändern des Rasters.",
    showLabelsLabel: "Farbbeschriftungen in den Zellen anzeigen",
    showLabelsHint:
      "Nützlich für ein PBM-Raster aus Nullen und Einsen, bei dem die Farbe allein leicht misszuverstehen ist.",
    partialCreditLabel: "Teilpunkte vergeben",
    partialCreditHint:
      "Ein Punkt je richtiger Zelle statt einer für das ganze Bild. Wer nur in einer Ecke danebenliegt, hatte den Rest richtig.",
    advanced: "Erweitert",
    pbmNoMagic: "Eine PBM-Liste beginnt mit „P1“.",
    pbmBadSize: "Nach P1 braucht der Kopf eine Breite und eine Höhe, beide ganze Zahlen größer als 0.",
    pbmCount:
      "Ein Bild mit {columns} mal {rows} Pixeln braucht {expected} Werte, die Liste hat aber {found}.",
    pbmBadValue: "In eine PBM-Liste gehören nur 0 und 1, nicht „{value}“.",
  },
};
