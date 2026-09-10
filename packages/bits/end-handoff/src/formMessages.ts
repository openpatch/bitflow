import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this step's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    titleLabel: "Title",
    markdownLabel: "Closing message",
    markdownHint: "Markdown is supported.",
    postMessageLabel: "Send the attempt to the page around this one",
    postMessageHint:
      "For bitflow embedded in a course page or an LMS, which is then the thing that keeps the result. The page receives a message of type “bitflow:attempt”.",
    originLabel: "Which page may receive it",
    originHint:
      "An exact address, like https://school.example — no path, and never *. A wildcard hands every answer to whatever page happens to have framed this one, and nothing warns anybody.",
    originInvalid:
      "That is not an address this can send to. Use scheme and host only, like https://school.example.",
    continueUrlLabel: "Link to somewhere else",
    continueUrlHint: "Optional. Shown as an ordinary link they choose to follow.",
    continueUrlInvalid:
      "Only a web address can be linked, like https://school.example/next or /next. Anything else is not offered to the learner at all.",
    continueLabelLabel: "Wording on the link",
    continueLabelHint: "Leave empty for “Continue”.",
  },
  de: {
    titleLabel: "Titel",
    markdownLabel: "Abschlusstext",
    markdownHint: "Markdown ist möglich.",
    postMessageLabel: "Den Versuch an die umgebende Seite senden",
    postMessageHint:
      "Für bitflow eingebettet in eine Kursseite oder ein LMS, das dann das Ergebnis aufbewahrt. Die Seite bekommt eine Nachricht vom Typ „bitflow:attempt“.",
    originLabel: "Welche Seite ihn empfangen darf",
    originHint:
      "Eine genaue Adresse wie https://schule.example — ohne Pfad und niemals *. Ein Platzhalter gibt jede Antwort an die Seite weiter, die diese hier gerade einbettet, ohne dass jemand gewarnt wird.",
    originInvalid:
      "An diese Adresse kann nicht gesendet werden. Nur Schema und Host, etwa https://schule.example.",
    continueUrlLabel: "Link zu etwas anderem",
    continueUrlHint: "Optional. Wird als gewöhnlicher Link angeboten.",
    continueUrlInvalid:
      "Verlinkt werden können nur Webadressen, etwa https://schule.example/weiter oder /weiter. Alles andere wird den Lernenden gar nicht erst angeboten.",
    continueLabelLabel: "Beschriftung des Links",
    continueLabelHint: "Leer lassen für „Weiter“.",
  },
};
