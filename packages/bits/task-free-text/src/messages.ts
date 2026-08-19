import type { Catalogs } from "@bitflow/core";

/** What the learner reads. Authoring labels live in `formMessages.ts`. */
export const messages: Catalogs = {
  en: {
    name: "Written answer",
    description:
      "A few sentences, kept for a person to read. Never graded as if a browser had understood them.",
    answerLabel: "Your answer",
    countUnlimited: "{count} characters",
    countTowards: "{count} of about {minimum} characters",
    countRemaining: "{count} of {maximum} characters",
    atLimit: "You have reached the length limit.",
    goingToReader:
      "This answer is read by a person. It is not marked here, and it does not count for or against your score.",
    goingToKeywords:
      "This answer is checked for the things listed below — for the words you used, not for what you meant. Use it to see what you have left out.",
    rubricHeading: "What is being looked for",
    modelHeading: "One way to answer it",
    mentioned: "Mentioned",
    notMentioned: "Not mentioned",
    awaitingReader: "Waiting for a person to read it",
    yourAnswerHeading: "What you wrote",
    nothingWritten: "Nothing written.",
    criterionMet: "{label} — mentioned",
    criterionMissed: "{label} — not mentioned",
    criterionPending: "{label} — for the reader to judge",
  },
  de: {
    name: "Freie Antwort",
    description:
      "Ein paar Sätze, aufbewahrt für einen Menschen. Nie so bewertet, als hätte ein Browser sie verstanden.",
    answerLabel: "Deine Antwort",
    countUnlimited: "{count} Zeichen",
    countTowards: "{count} von etwa {minimum} Zeichen",
    countRemaining: "{count} von {maximum} Zeichen",
    atLimit: "Du hast die Längengrenze erreicht.",
    goingToReader:
      "Diese Antwort liest ein Mensch. Sie wird hier nicht bewertet und zählt weder für noch gegen deine Punkte.",
    goingToKeywords:
      "Diese Antwort wird auf die unten genannten Punkte geprüft — auf die Wörter, die du benutzt hast, nicht auf das, was du gemeint hast. Nutze es, um zu sehen, was fehlt.",
    rubricHeading: "Worauf geachtet wird",
    modelHeading: "Eine mögliche Antwort",
    mentioned: "Erwähnt",
    notMentioned: "Nicht erwähnt",
    awaitingReader: "Wartet darauf, gelesen zu werden",
    yourAnswerHeading: "Was du geschrieben hast",
    nothingWritten: "Nichts geschrieben.",
    criterionMet: "{label} — erwähnt",
    criterionMissed: "{label} — nicht erwähnt",
    criterionPending: "{label} — von der lesenden Person zu beurteilen",
  },
};
