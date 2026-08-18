import type { Catalogs } from "@bitflow/core";

/**
 * What a learner reads, plus the name and description the editor's palette
 * shows for this task type.
 *
 * Kept apart from the authoring form's labels so each catalog can be complete
 * in the locales it declares. Mixing them is what left six languages with a
 * translated question and an English form around it.
 */
export const messages: Catalogs = {
  en: {
    name: "Choice",
    description: "Pick one or several answers from a list.",
    legendSingle: "Choose one answer",
    legendMultiple: "Choose all answers that apply",
    correct: "correct",
    wrong: "wrong",
    // Authoring
  },
  de: {
    name: "Auswahl",
    description: "Eine oder mehrere Antworten aus einer Liste auswählen.",
    legendSingle: "Wähle eine Antwort",
    legendMultiple: "Wähle alle zutreffenden Antworten",
    correct: "richtig",
    wrong: "falsch",
  },
  fr: {
    name: "Choix",
    description: "Choisir une ou plusieurs réponses dans une liste.",
    legendSingle: "Choisissez une réponse",
    legendMultiple: "Choisissez toutes les réponses qui conviennent",
    correct: "correct",
    wrong: "incorrect",
  },
  nl: {
    name: "Keuze",
    description: "Kies een of meer antwoorden uit een lijst.",
    legendSingle: "Kies één antwoord",
    legendMultiple: "Kies alle antwoorden die kloppen",
    correct: "juist",
    wrong: "niet juist",
  },
  es: {
    name: "Elección",
    description: "Elegir una o varias respuestas de una lista.",
    legendSingle: "Elige una respuesta",
    legendMultiple: "Elige todas las respuestas correctas",
    correct: "correcto",
    wrong: "incorrecto",
  },
  it: {
    name: "Scelta",
    description: "Scegliere una o più risposte da un elenco.",
    legendSingle: "Scegli una risposta",
    legendMultiple: "Scegli tutte le risposte corrette",
    correct: "corretto",
    wrong: "non corretto",
  },
  pt: {
    name: "Escolha",
    description: "Escolher uma ou mais respostas de uma lista.",
    legendSingle: "Escolhe uma resposta",
    legendMultiple: "Escolhe todas as respostas corretas",
    correct: "correto",
    wrong: "incorreto",
  },
  tr: {
    name: "Seçim",
    description: "Listeden bir veya birden fazla yanıt seçin.",
    legendSingle: "Bir yanıt seçin",
    legendMultiple: "Uygun olan tüm yanıtları seçin",
    correct: "doğru",
    wrong: "yanlış",
  },
};
