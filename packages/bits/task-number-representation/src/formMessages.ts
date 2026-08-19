import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the value. Markdown is allowed.",
    sourceRepresentationLabel: "The value is given in",
    sourceValueLabel: "The value",
    sourceValueHint:
      "Written in the representation above. Text is taken character by character, so “HI” is two values.",
    targetRepresentationLabel: "The learner writes it in",
    bitWidthLabel: "Width, in bits",
    bitWidthHint:
      "The width belongs to the value rather than to either way of writing it. Zero for a plain integer with no fixed width.",
    signedLabel: "The top bit is a sign",
    signedHint:
      "Two's complement: in eight bits, 11010110 and −42 are the same value.",
    allowPrefixLabel: "Accept 0b, 0o and 0x",
    allowSeparatorsLabel: "Accept spaces between groups",
    allowSeparatorsHint:
      "Needed whenever the answer is more than one group, as an ASCII answer usually is.",
    requireFullWidthLabel: "Require the leading zeros",
    requireFullWidthHint:
      "On, an eight-bit answer has to be eight digits long. Off, 101010 and 00101010 are both accepted.",
    scoringLabel: "How it is marked",
    scoringHint:
      "Digit by digit needs a fixed width written out in full, so the two line up position for position.",
    scoringAnswer: "One mark for the value",
    scoringDigits: "A mark per digit in the right place",
    representationDecimal: "Decimal",
    representationBinary: "Binary",
    representationOctal: "Octal",
    representationHex: "Hexadecimal",
    representationText: "Text (ASCII / Unicode)",
    expectedLabel: "The answer",
    expectedHint: "What the learner has to write, as this task will accept it.",
    expectedNone: "The value above cannot be read yet.",
    advanced: "Advanced",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Wert angezeigt. Markdown ist erlaubt.",
    sourceRepresentationLabel: "Der Wert ist gegeben in",
    sourceValueLabel: "Der Wert",
    sourceValueHint:
      "In der oben gewählten Darstellung. Text wird zeichenweise genommen, „HI“ sind also zwei Werte.",
    targetRepresentationLabel: "Die Lernenden schreiben ihn in",
    bitWidthLabel: "Breite in Bit",
    bitWidthHint:
      "Die Breite gehört zum Wert, nicht zu einer der Schreibweisen. Null für eine ganze Zahl ohne feste Breite.",
    signedLabel: "Das oberste Bit ist ein Vorzeichen",
    signedHint:
      "Zweierkomplement: in acht Bit sind 11010110 und −42 derselbe Wert.",
    allowPrefixLabel: "0b, 0o und 0x akzeptieren",
    allowSeparatorsLabel: "Leerzeichen zwischen Gruppen akzeptieren",
    allowSeparatorsHint:
      "Nötig, sobald die Antwort aus mehreren Gruppen besteht — bei ASCII fast immer.",
    requireFullWidthLabel: "Führende Nullen verlangen",
    requireFullWidthHint:
      "An muss eine Acht-Bit-Antwort acht Stellen haben. Aus werden 101010 und 00101010 beide akzeptiert.",
    scoringLabel: "Wie gewertet wird",
    scoringHint:
      "Stellenweise braucht eine feste, ausgeschriebene Breite, damit beide Seiten Stelle für Stelle zueinander passen.",
    scoringAnswer: "Ein Punkt für den Wert",
    scoringDigits: "Ein Punkt je richtiger Stelle",
    representationDecimal: "Dezimal",
    representationBinary: "Binär",
    representationOctal: "Oktal",
    representationHex: "Hexadezimal",
    representationText: "Text (ASCII / Unicode)",
    expectedLabel: "Die Antwort",
    expectedHint: "Was die Lernenden schreiben müssen, so wie diese Aufgabe es annimmt.",
    expectedNone: "Der Wert oben lässt sich noch nicht lesen.",
    advanced: "Erweitert",
  },
};
