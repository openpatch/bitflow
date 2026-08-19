import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Number representation",
    description:
      "A value to write again in another representation: binary, hexadecimal, two's complement, ASCII.",
    howTo: "Write the same value in {target}.",
    howToReadonly: "The answer is shown as it was left.",
    givenLabel: "You are given",
    inRepresentation: "in {representation}",
    widthNote: "{bits}-bit, {sign}",
    signSigned: "signed, two's complement",
    signUnsigned: "unsigned",
    answerLabel: "Your answer, in {target}",
    fullWidthHint: "Write all {digits} digits, leading zeros included.",
    prefixHint: "A 0b, 0o or 0x in front is accepted.",
    separatorHint: "Spaces between groups are fine.",
    reading: "That reads as {value}.",
    readingUnreadable: "That cannot be read as {target} yet.",
    decimalWord: "decimal",
    binaryWord: "binary",
    octalWord: "octal",
    hexWord: "hexadecimal",
    textWord: "text",
    correct: "correct",
    wrong: "wrong",
    reasonCorrect: "That is the same value.",
    reasonEmpty: "Nothing was written.",
    reasonBadDigit: "That uses a digit {target} does not have.",
    reasonNegative:
      "With a fixed width the sign is part of the pattern, so a minus sign cannot be used here.",
    reasonTooWide: "That does not fit in {bits} bits.",
    reasonNotFullWidth: "The answer is {digits} digits long; that one is not.",
    reasonWrongValue: "That is a value, but not the same one.",
  },
  de: {
    name: "Zahldarstellung",
    description:
      "Ein Wert, der anders geschrieben werden soll: binär, hexadezimal, Zweierkomplement, ASCII.",
    howTo: "Schreib denselben Wert in {target}.",
    howToReadonly: "Die Antwort steht so, wie sie gelassen wurde.",
    givenLabel: "Gegeben ist",
    inRepresentation: "in {representation}",
    widthNote: "{bits} Bit, {sign}",
    signSigned: "vorzeichenbehaftet, Zweierkomplement",
    signUnsigned: "vorzeichenlos",
    answerLabel: "Deine Antwort, in {target}",
    fullWidthHint: "Schreib alle {digits} Stellen, führende Nullen eingeschlossen.",
    prefixHint: "Ein vorangestelltes 0b, 0o oder 0x ist erlaubt.",
    separatorHint: "Leerzeichen zwischen Gruppen sind in Ordnung.",
    reading: "Das ergibt {value}.",
    readingUnreadable: "Das lässt sich noch nicht als {target} lesen.",
    decimalWord: "Dezimal",
    binaryWord: "Binär",
    octalWord: "Oktal",
    hexWord: "Hexadezimal",
    textWord: "Text",
    correct: "richtig",
    wrong: "falsch",
    reasonCorrect: "Das ist derselbe Wert.",
    reasonEmpty: "Es wurde nichts geschrieben.",
    reasonBadDigit: "Da steht eine Ziffer, die es in {target} nicht gibt.",
    reasonNegative:
      "Bei fester Breite gehört das Vorzeichen zum Bitmuster, ein Minuszeichen geht hier also nicht.",
    reasonTooWide: "Das passt nicht in {bits} Bit.",
    reasonNotFullWidth: "Die Antwort hat {digits} Stellen; diese nicht.",
    reasonWrongValue: "Das ist ein Wert, aber nicht derselbe.",
  },
};
