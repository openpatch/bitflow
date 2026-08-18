import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Instruction",
    instructionHint: "Shown above the passage. Markdown is allowed.",
    textLabel: "The passage to type",
    textHint:
      "Long enough to measure typing rather than starting and stopping — a sentence or two.",
    scoringLabel: "Count",
    scoringHint:
      "Accuracy is the half everyone can be asked for, so speed is only ever a second mark, never the only one.",
    scoringAccuracy: "A point for typing it accurately",
    scoringAccuracyAndSpeed: "A point for accuracy, another for speed",
    accuracyLabel: "Accuracy needed",
    accuracyHint: "Percent of the passage that has to be right.",
    wpmLabel: "Words a minute for the speed mark",
    wpmHint: "Net words a minute, counting five characters to a word. 25 is comfortable; 40 is brisk.",
    timedLabel: "Time the attempt",
    timedHint:
      "Switch it off for a class where speed is not the point. Someone who types accurately with one finger, a switch or a head pointer is not typing badly, and a clock on the screen says otherwise.",
    optOutLabel: "Let the learner stand down",
    optOutHint:
      "This task needs a keyboard. Standing down leaves it unmarked rather than wrong, so it neither helps nor hurts the learner's total.",
    advanced: "Advanced",
  },
  de: {
    instructionLabel: "Aufgabenstellung",
    instructionHint: "Wird über dem Text angezeigt. Markdown ist erlaubt.",
    textLabel: "Der abzutippende Text",
    textHint:
      "Lang genug, um das Tippen zu messen und nicht das Anfangen und Aufhören — ein bis zwei Sätze.",
    scoringLabel: "Zählung",
    scoringHint:
      "Genauigkeit kann man von allen verlangen, Tempo daher immer nur als zweiter Punkt, nie als einziger.",
    scoringAccuracy: "Ein Punkt fürs genaue Abtippen",
    scoringAccuracyAndSpeed: "Ein Punkt für Genauigkeit, einer fürs Tempo",
    accuracyLabel: "Nötige Genauigkeit",
    accuracyHint: "Prozent des Textes, die stimmen müssen.",
    wpmLabel: "Wörter pro Minute für den Tempo-Punkt",
    wpmHint: "Netto-Wörter pro Minute, fünf Zeichen je Wort. 25 ist gemütlich, 40 ist flott.",
    timedLabel: "Versuch stoppen",
    timedHint:
      "Für Klassen ausschalten, in denen es nicht ums Tempo geht. Wer mit einem Finger, einem Taster oder einem Kopfzeiger genau tippt, tippt nicht schlecht — eine laufende Uhr behauptet das Gegenteil.",
    optOutLabel: "Abmelden erlauben",
    optOutHint:
      "Diese Aufgabe braucht eine Tastatur. Wer sich abmeldet, bekommt sie unbewertet statt falsch — es hilft also weder noch schadet es.",
    advanced: "Erweitert",
  },
};
