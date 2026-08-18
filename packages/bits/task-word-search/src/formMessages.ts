import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the grid. Markdown is allowed.",
    wordsLabel: "Words to hide",
    wordsHint:
      "One per line. The grid is built from them and settles into the same shape every time.",
    sizeLabel: "Grid size",
    sizeHint: "Rows by columns. Too small and the words will not fit; too large and they are lost in the filler.",
    rows: "Rows",
    columns: "Columns",
    directionsLabel: "Which ways words may run",
    directionsHint:
      "Backwards and diagonal runs make the puzzle much harder. Left to right only is the gentlest.",
    east: "Left to right",
    west: "Right to left",
    south: "Downwards",
    north: "Upwards",
    southEast: "Diagonally down, to the right",
    southWest: "Diagonally down, to the left",
    northEast: "Diagonally up, to the right",
    northWest: "Diagonally up, to the left",
    showWordsLabel: "List the words",
    showWordsHint:
      "Off, the learner is told only how many there are — much harder, and how this is set as a spelling exercise rather than a hunting one.",
    unplaced:
      "No room for {words}. Make the grid bigger, allow more directions, or shorten the word.",
    previewLabel: "The grid",
    previewHint: "What the learner will see, with the hidden words picked out.",
    noWords: "No words yet.",
    advanced: "Advanced",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Gitter angezeigt. Markdown ist erlaubt.",
    wordsLabel: "Zu versteckende Wörter",
    wordsHint:
      "Eines pro Zeile. Das Gitter wird daraus gebaut und fällt jedes Mal gleich aus.",
    sizeLabel: "Gittergröße",
    sizeHint: "Zeilen mal Spalten. Zu klein passen die Wörter nicht; zu groß gehen sie in den Füllbuchstaben unter.",
    rows: "Zeilen",
    columns: "Spalten",
    directionsLabel: "Erlaubte Richtungen",
    directionsHint:
      "Rückwärts und diagonal machen das Rätsel deutlich schwerer. Nur von links nach rechts ist am leichtesten.",
    east: "Von links nach rechts",
    west: "Von rechts nach links",
    south: "Nach unten",
    north: "Nach oben",
    southEast: "Diagonal nach unten rechts",
    southWest: "Diagonal nach unten links",
    northEast: "Diagonal nach oben rechts",
    northWest: "Diagonal nach oben links",
    showWordsLabel: "Wörter auflisten",
    showWordsHint:
      "Ausgeschaltet erfahren die Lernenden nur, wie viele es sind — deutlich schwerer, und so wird daraus eine Rechtschreib- statt einer Suchaufgabe.",
    unplaced:
      "Kein Platz für {words}. Mach das Gitter größer, erlaube mehr Richtungen oder kürze das Wort.",
    previewLabel: "Das Gitter",
    previewHint: "Was die Lernenden sehen, hier mit den versteckten Wörtern hervorgehoben.",
    noWords: "Noch keine Wörter.",
    advanced: "Erweitert",
  },
};
