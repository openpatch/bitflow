import type { Catalogs } from "@bitflow/core";

/** Authoring labels. Learner-facing strings live in `messages.ts`. */
export const formMessages: Catalogs = {
  en: {
    instructionLabel: "Question",
    instructionHint: "Markdown is supported. Ask for the reasoning, not the word.",
    placeholderLabel: "Prompt inside the empty box",
    placeholderHint:
      "Optional. A nudge towards the shape of an answer — not an example of one, which writes it for them.",
    markingLabel: "Who marks it",
    markingPerson: "A person, later",
    markingKeywords: "Words to look for, here in the page",
    markingPersonHint:
      "The task scores nothing out of nothing, so it neither rewards nor penalises, and the answer travels in the attempt for whoever reads it. This is the honest setting for an open question.",
    markingKeywordsHint:
      "Each line below looks for its words. The learner is told that is what happened — it is a checklist, not an understanding, and a good answer in other words scores zero.",
    criteriaLabel: "Rubric",
    criteriaHint:
      "One line per thing you are looking for. A person marking reads these; looking for words uses them.",
    noCriteria: "No rubric lines yet.",
    addCriterion: "Add a rubric line",
    criterionLabelOf: "What rubric line {position} is looking for",
    criterionLabelPlaceholder: "“Explains why the list must be sorted”",
    criterionPointsOf: "What {label} is worth",
    removeCriterionOf: "Remove {label}",
    moveUpOf: "Move {label} up",
    moveDownOf: "Move {label} down",
    keywordsLabel: "Words that count as mentioning it",
    keywordsHint:
      "One per line, and any one of them counts — they are spellings of the same idea, not a list of requirements. Whole words only, so “sort” is not met by “assortment”. A line with a space in it is looked for as a phrase.",
    unnamedCriterion: "Rubric line {number}",
    modelLabel: "A model answer",
    modelHint:
      "Optional, shown once the answer is in. Markdown is supported. Useful while a learner waits to be read; leave it empty where handing one out would give the question away.",
    lengthLabel: "Length",
    lengthHint:
      "In characters, ignoring space at the ends. Leave either at 0 for no limit.",
    minimumLabel: "Suggested shortest",
    minimumFieldHint:
      "Shown as a count while they write. Never blocks submitting — a learner who has said it in fewer words has not done anything wrong.",
    maximumLabel: "Longest allowed",
    maximumFieldHint: "Enforced by the box, so nobody writes past it and finds out afterwards.",
    caseSensitiveLabel: "Capital letters matter",
    caseSensitiveHint: "Off, “Sorted” and “sorted” are the same word.",
    advanced: "Advanced",
  },
  de: {
    instructionLabel: "Frage",
    instructionHint:
      "Markdown ist möglich. Frag nach der Begründung, nicht nach dem Wort.",
    placeholderLabel: "Hinweis im leeren Feld",
    placeholderHint:
      "Optional. Ein Wink auf die Form einer Antwort — kein Beispiel, das sie schon schreibt.",
    markingLabel: "Wer bewertet",
    markingPerson: "Ein Mensch, später",
    markingKeywords: "Wörter, nach denen hier gesucht wird",
    markingPersonHint:
      "Die Aufgabe zählt null von null, belohnt also weder noch bestraft sie, und die Antwort reist im Versuch mit, für die lesende Person. Das ist die ehrliche Einstellung für eine offene Frage.",
    markingKeywordsHint:
      "Jede Zeile unten sucht ihre Wörter. Den Lernenden wird gesagt, dass genau das passiert ist — es ist eine Checkliste, kein Verstehen, und eine gute Antwort in anderen Worten bekommt null.",
    criteriaLabel: "Bewertungsraster",
    criteriaHint:
      "Eine Zeile je gesuchter Sache. Wer von Hand bewertet, liest sie; die Wortsuche benutzt sie.",
    noCriteria: "Noch keine Zeilen.",
    addCriterion: "Zeile hinzufügen",
    criterionLabelOf: "Wonach Zeile {position} sucht",
    criterionLabelPlaceholder: "„Erklärt, warum die Liste sortiert sein muss“",
    criterionPointsOf: "Was {label} wert ist",
    removeCriterionOf: "{label} entfernen",
    moveUpOf: "{label} nach oben",
    moveDownOf: "{label} nach unten",
    keywordsLabel: "Wörter, die als Erwähnung zählen",
    keywordsHint:
      "Eines je Zeile, und jedes einzelne genügt — es sind Schreibweisen derselben Idee, keine Liste von Bedingungen. Nur ganze Wörter, „sortiert“ wird also nicht von „unsortiertes“ erfüllt. Eine Zeile mit Leerzeichen wird als Wortgruppe gesucht.",
    unnamedCriterion: "Zeile {number}",
    modelLabel: "Eine Musterantwort",
    modelHint:
      "Optional, wird nach der Abgabe gezeigt. Markdown ist möglich. Nützlich, solange Lernende aufs Lesen warten; lass es leer, wo sie die Frage verraten würde.",
    lengthLabel: "Länge",
    lengthHint:
      "In Zeichen, ohne Leerraum an den Enden. Lass eines auf 0 für keine Grenze.",
    minimumLabel: "Vorgeschlagene Mindestlänge",
    minimumFieldHint:
      "Wird beim Schreiben als Zähler angezeigt. Blockiert nie die Abgabe — wer es kürzer sagen kann, hat nichts falsch gemacht.",
    maximumLabel: "Höchstlänge",
    maximumFieldHint:
      "Vom Feld durchgesetzt, damit niemand darüber hinausschreibt und es hinterher erfährt.",
    caseSensitiveLabel: "Groß- und Kleinschreibung beachten",
    caseSensitiveHint: "Aus sind „Sortiert“ und „sortiert“ dasselbe Wort.",
    advanced: "Erweitert",
  },
};
