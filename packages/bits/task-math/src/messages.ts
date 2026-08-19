import type { Catalogs } from "@bitflow/core";

/** Learner-facing strings. Authoring labels live in `formMessages.ts`. */
export const messages: Catalogs = {
  en: {
    name: "Maths",
    description:
      "An answer written as maths — fractions, powers, roots — compared as maths.",
    answerLabel: "Your answer",
    blankLabel: "Blank {name}",
    loading: "Loading the maths editor…",
    unavailable:
      "The maths editor could not be loaded. You can still answer by typing LaTeX.",
    latexLabel: "Your answer, as LaTeX",
    latexHint: "For example \\frac{1}{2} for a half, or x^2 for x squared.",
    blankRight: "Right",
    blankWrong: "Not right",
    scoreLine: "{right} of {total} right.",
    keyboardHint:
      "Type as usual, or press the keyboard button for symbols. / makes a fraction, ^ a power.",
  },
  de: {
    name: "Mathematik",
    description:
      "Eine als Mathematik geschriebene Antwort — Brüche, Potenzen, Wurzeln — und als Mathematik verglichen.",
    answerLabel: "Deine Antwort",
    blankLabel: "Lücke {name}",
    loading: "Der Formeleditor wird geladen…",
    unavailable:
      "Der Formeleditor konnte nicht geladen werden. Du kannst weiterhin mit LaTeX antworten.",
    latexLabel: "Deine Antwort als LaTeX",
    latexHint: "Zum Beispiel \\frac{1}{2} für ein Halb oder x^2 für x hoch zwei.",
    blankRight: "Richtig",
    blankWrong: "Nicht richtig",
    scoreLine: "{right} von {total} richtig.",
    keyboardHint:
      "Tippe wie gewohnt oder öffne mit der Tastaturschaltfläche die Symbole. / erzeugt einen Bruch, ^ eine Potenz.",
  },
};
