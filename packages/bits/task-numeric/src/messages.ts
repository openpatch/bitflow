import type { Catalogs } from "@bitflow/core";

/** Learner-facing strings. Authoring labels live in `formMessages.ts`. */
export const messages: Catalogs = {
  en: {
    name: "Number",
    description:
      "A number or a short calculation, checked against an expected value.",
    answerLabel: "Your answer",
    placeholder: "Type a number",
    placeholderExpression: "Type a number or a calculation",
    unitAria: "The unit is {unit}",
    readsAs: "Reads as {value}",
    cannotRead: "That is not a number this task can read.",
    notFinite: "That does not work out to a number.",
    expressionNotAllowed: "Work it out and give the answer as a number.",
    tooLong: "That is longer than this answer needs to be.",
    hintExpression:
      "You can type a calculation, such as 3/4, 2*pi or sqrt(2).",
    hintUnitRequired: "Give the unit as well as the number.",
    hintDecimalsZero: "Give your answer as a whole number.",
    hintDecimalsOne: "Give your answer to one decimal place.",
    hintDecimals: "Give your answer to {digits} decimal places.",
    hintSignificantOne: "Give your answer to one significant figure.",
    hintSignificant: "Give your answer to {digits} significant figures.",
    outcomeUnitWrong: "The number is right, but the unit is not.",
    outcomeUnitMissing: "The number is right, but the unit is missing.",
    outcomeValueWrong: "The unit is right, but the number is not.",
    outcomeExpected: "The expected answer was {value}.",
  },
  de: {
    name: "Zahl",
    description:
      "Eine Zahl oder eine kurze Rechnung, gegen einen erwarteten Wert geprüft.",
    answerLabel: "Deine Antwort",
    placeholder: "Zahl eingeben",
    placeholderExpression: "Zahl oder Rechnung eingeben",
    unitAria: "Die Einheit ist {unit}",
    readsAs: "Wird gelesen als {value}",
    cannotRead: "Das ist keine Zahl, die diese Aufgabe lesen kann.",
    notFinite: "Das ergibt keine Zahl.",
    expressionNotAllowed: "Rechne es aus und gib das Ergebnis als Zahl an.",
    tooLong: "Das ist länger, als diese Antwort sein muss.",
    hintExpression:
      "Du kannst eine Rechnung eingeben, zum Beispiel 3/4, 2*pi oder sqrt(2).",
    hintUnitRequired: "Gib neben der Zahl auch die Einheit an.",
    hintDecimalsZero: "Gib deine Antwort als ganze Zahl an.",
    hintDecimalsOne: "Gib deine Antwort auf eine Nachkommastelle genau an.",
    hintDecimals: "Gib deine Antwort auf {digits} Nachkommastellen genau an.",
    hintSignificantOne: "Gib deine Antwort mit einer signifikanten Stelle an.",
    hintSignificant: "Gib deine Antwort mit {digits} signifikanten Stellen an.",
    outcomeUnitWrong: "Die Zahl stimmt, die Einheit nicht.",
    outcomeUnitMissing: "Die Zahl stimmt, aber die Einheit fehlt.",
    outcomeValueWrong: "Die Einheit stimmt, die Zahl nicht.",
    outcomeExpected: "Erwartet war {value}.",
  },
};
