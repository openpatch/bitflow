import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Question",
    instructionHint: "Shown above the field. Markdown is allowed.",
    latexLabel: "The formula",
    latexHint:
      "LaTeX. Leave it as one expression for a single answer box, or put \\placeholder[name]{} where you want a gap the learner fills in.",
    latexEmpty: "A single answer box, with nothing printed around it.",
    blanksHeading: "What each blank should come to",
    singleHeading: "The expected answer",
    expectedLabel: "Expected",
    expectedFor: "Expected for “{name}”",
    acceptedLabel: "Also accepted",
    acceptedHint: "One per line, for answers the comparison will not know are the same.",
    compareLabel: "When is an answer right?",
    compareSymbolic: "The same expression, however it is written",
    compareSymbolicHint:
      "2x, x·2 and 2×x match. A factorised answer does not match an expanded one — which is what “factorise it” needs.",
    compareEquivalent: "Anything mathematically equal to it",
    compareEquivalentHint:
      "(2x−1)(x+1) now matches 2x²+x−1. The wrong choice for “factorise it”: it would accept the question back unchanged.",
    compareValue: "It comes to the same number",
    compareValueHint: "For “how much is it”, where nothing is left unknown.",
    toleranceLabel: "Give or take",
    partialLabel: "A mark for each blank",
    partialHint: "Off, the whole formula has to be right for anything.",
    keyboardLabel: "Offer the on-screen maths keyboard",
    keyboardHint: "How the task is answerable on a phone at all. Leave it on unless a physical keyboard is part of the question.",
    feedbackLabel: "Feedback for particular answers",
    feedbackHint:
      "One per line, as blank, then a colon, then the answer, then a colon, then what to say. Use answer for the single box.",
    previewLabel: "What the learner sees",
    addBlank: "Add a blank",
    advanced: "Advanced",
    noBlanks: "No blanks: the learner gets one answer box.",
    blanksFound: "{count} blank(s): {names}.",
  },
  de: {
    instructionLabel: "Frage",
    instructionHint: "Wird über dem Feld angezeigt. Markdown ist erlaubt.",
    latexLabel: "Die Formel",
    latexHint:
      "LaTeX. Als einzelner Ausdruck ergibt sich ein Antwortfeld; mit \\placeholder[name]{} entsteht dort eine Lücke zum Ausfüllen.",
    latexEmpty: "Ein einzelnes Antwortfeld, ohne etwas drumherum.",
    blanksHeading: "Was in die Lücken gehört",
    singleHeading: "Die erwartete Antwort",
    expectedLabel: "Erwartet",
    expectedFor: "Erwartet für „{name}“",
    acceptedLabel: "Ebenfalls gültig",
    acceptedHint:
      "Eine pro Zeile, für Antworten, die der Vergleich nicht als gleich erkennt.",
    compareLabel: "Wann ist eine Antwort richtig?",
    compareSymbolic: "Derselbe Ausdruck, egal wie geschrieben",
    compareSymbolicHint:
      "2x, x·2 und 2×x stimmen überein. Eine faktorisierte Antwort stimmt nicht mit einer ausmultiplizierten überein — genau das braucht „faktorisiere“.",
    compareEquivalent: "Alles mathematisch Gleichwertige",
    compareEquivalentHint:
      "(2x−1)(x+1) stimmt jetzt mit 2x²+x−1 überein. Falsch für „faktorisiere“: die Frage selbst würde als Antwort gelten.",
    compareValue: "Es ergibt dieselbe Zahl",
    compareValueHint: "Für „wie viel ist das“, wenn nichts unbekannt bleibt.",
    toleranceLabel: "Plus/minus",
    partialLabel: "Ein Punkt pro Lücke",
    partialHint: "Ausgeschaltet muss die ganze Formel stimmen.",
    keyboardLabel: "Bildschirmtastatur für Mathematik anbieten",
    keyboardHint:
      "Nur damit ist die Aufgabe am Telefon überhaupt lösbar. Eingeschaltet lassen, außer eine echte Tastatur gehört zur Frage.",
    feedbackLabel: "Rückmeldung zu bestimmten Antworten",
    feedbackHint:
      "Eine pro Zeile: Lücke, Doppelpunkt, Antwort, Doppelpunkt, Rückmeldung. Für das einzelne Feld answer verwenden.",
    previewLabel: "Was die Lernenden sehen",
    addBlank: "Lücke einfügen",
    advanced: "Erweitert",
    noBlanks: "Keine Lücken: die Lernenden bekommen ein Antwortfeld.",
    blanksFound: "{count} Lücke(n): {names}.",
  },
};
