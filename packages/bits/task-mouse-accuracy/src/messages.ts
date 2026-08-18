import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Pointing accuracy",
    description: "Timed clicks on a sequence of targets, for lessons about pointing.",
    needsPointer:
      "This task needs a mouse, a trackpad or a touchscreen: it measures how accurately and how quickly you can point at something.",
    howTo: "{total} targets appear one at a time. Click each one as accurately as you can.",
    howToReadonly: "The clicks are shown where they landed.",
    start: "Start",
    optOut: "I can't use a pointing device",
    optOutHint:
      "Standing down costs you nothing: the task is left unmarked rather than marked wrong.",
    stoodDown: "Stood down. This task will not be marked.",
    stoodDownNotice: "You stood down from this task, so it is not being marked.",
    started: "Started. {total} targets.",
    progress: "Target {round} of {total}",
    allDone: "All {total} targets done.",
    roundHit: "Hit. Target {round} of {total}, {ms} milliseconds.",
    roundMiss: "Missed. Target {round} of {total}.",
    roundsCaption: "What each click came to",
    colRound: "Target",
    colResult: "Result",
    colTime: "Time",
    colDifficulty: "Difficulty",
    hit: "Hit",
    miss: "Missed",
    ms: "{ms} ms",
  },
  de: {
    name: "Zielgenauigkeit",
    description: "Klicks auf eine Folge von Zielen, für Unterricht über Zeigegeräte.",
    needsPointer:
      "Diese Aufgabe braucht eine Maus, ein Trackpad oder einen Touchscreen: Sie misst, wie genau und wie schnell du auf etwas zeigen kannst.",
    howTo: "{total} Ziele erscheinen nacheinander. Klick jedes so genau wie möglich an.",
    howToReadonly: "Die Klicks stehen dort, wo sie gelandet sind.",
    start: "Los",
    optOut: "Ich kann kein Zeigegerät benutzen",
    optOutHint:
      "Das kostet dich nichts: Die Aufgabe bleibt unbewertet statt falsch.",
    stoodDown: "Abgemeldet. Diese Aufgabe wird nicht bewertet.",
    stoodDownNotice: "Du hast dich von dieser Aufgabe abgemeldet, sie wird nicht bewertet.",
    started: "Los geht's. {total} Ziele.",
    progress: "Ziel {round} von {total}",
    allDone: "Alle {total} Ziele erledigt.",
    roundHit: "Getroffen. Ziel {round} von {total}, {ms} Millisekunden.",
    roundMiss: "Daneben. Ziel {round} von {total}.",
    roundsCaption: "Ergebnis der einzelnen Klicks",
    colRound: "Ziel",
    colResult: "Ergebnis",
    colTime: "Zeit",
    colDifficulty: "Schwierigkeit",
    hit: "Getroffen",
    miss: "Daneben",
    ms: "{ms} ms",
  },
};
