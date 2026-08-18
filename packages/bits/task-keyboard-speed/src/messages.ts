import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Typing",
    description: "Typing an author's text back, measured for accuracy and speed.",
    needsKeyboard: "This task needs a keyboard.",
    howTo:
      "Type the passage into the box. The clock runs from your first character to your last, so read it through first if you like, and stopping after you have finished costs you nothing.",
    howToReadonly: "The typing is shown as it was left.",
    boxLabel: "Type the passage here",
    elapsed: "{seconds} s",
    typedCount: "{typed} of {total} characters",
    accuracy: "{percent}% right",
    wpm: "{wpm} words a minute",
    optOut: "Typing speed isn't a fair measure of me",
    optOutHint: "The task is left unmarked rather than marked wrong.",
    stoodDown: "Stood down. This task will not be marked.",
    stoodDownNotice: "You stood down from this task, so it is not being marked.",
  },
  de: {
    name: "Tippen",
    description: "Einen vorgegebenen Text abtippen, gemessen nach Genauigkeit und Tempo.",
    needsKeyboard: "Diese Aufgabe braucht eine Tastatur.",
    howTo:
      "Tipp den Text in das Feld. Die Zeit läuft vom ersten bis zum letzten Zeichen — lies also ruhig erst in Ruhe, und nach dem letzten Zeichen kostet Warten nichts mehr.",
    howToReadonly: "Der getippte Text steht so, wie er gelassen wurde.",
    boxLabel: "Text hier eintippen",
    elapsed: "{seconds} s",
    typedCount: "{typed} von {total} Zeichen",
    accuracy: "{percent}% richtig",
    wpm: "{wpm} Wörter pro Minute",
    optOut: "Tippgeschwindigkeit misst mich nicht fair",
    optOutHint: "Die Aufgabe bleibt unbewertet statt falsch.",
    stoodDown: "Abgemeldet. Diese Aufgabe wird nicht bewertet.",
    stoodDownNotice: "Du hast dich von dieser Aufgabe abgemeldet, sie wird nicht bewertet.",
  },
};
