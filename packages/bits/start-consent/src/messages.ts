import type { Catalogs } from "@bitflow/core";

/**
 * What the learner reads. Every locale complete — see `formMessages.ts` for
 * the authoring labels, which are English and German only.
 */
export const messages: Catalogs = {
  en: {
    name: "Consent",
    description:
      "Says what the assessment records and asks the learner to agree before it starts.",
    choiceLegend: "Do you agree?",
    agreeFallback: "I agree to take part.",
    declineFallback: "I would rather not take part.",
    requiredFallback: "Choose one before you start.",
  },
  de: {
    name: "Einwilligung",
    description:
      "Sagt, was der Test aufzeichnet, und fragt vor dem Start nach Zustimmung.",
    choiceLegend: "Bist du einverstanden?",
    agreeFallback: "Ich mache mit.",
    declineFallback: "Ich möchte lieber nicht mitmachen.",
    requiredFallback: "Wähle eins aus, bevor es losgeht.",
  },
  fr: {
    name: "Consentement",
    description:
      "Indique ce que l'évaluation enregistre et demande l'accord avant de commencer.",
    choiceLegend: "Êtes-vous d'accord ?",
    agreeFallback: "J'accepte de participer.",
    declineFallback: "Je préfère ne pas participer.",
    requiredFallback: "Choisissez avant de commencer.",
  },
  nl: {
    name: "Toestemming",
    description:
      "Vertelt wat de toets vastlegt en vraagt om akkoord voordat die begint.",
    choiceLegend: "Ga je akkoord?",
    agreeFallback: "Ik doe mee.",
    declineFallback: "Ik doe liever niet mee.",
    requiredFallback: "Kies er een voordat je begint.",
  },
  es: {
    name: "Consentimiento",
    description:
      "Explica qué registra la evaluación y pide el acuerdo antes de empezar.",
    choiceLegend: "¿Estás de acuerdo?",
    agreeFallback: "Acepto participar.",
    declineFallback: "Prefiero no participar.",
    requiredFallback: "Elige una opción antes de empezar.",
  },
  it: {
    name: "Consenso",
    description:
      "Dice che cosa registra la verifica e chiede l'accordo prima di iniziare.",
    choiceLegend: "Sei d'accordo?",
    agreeFallback: "Accetto di partecipare.",
    declineFallback: "Preferisco non partecipare.",
    requiredFallback: "Scegline una prima di iniziare.",
  },
  pt: {
    name: "Consentimento",
    description:
      "Diz o que o teste regista e pede o acordo antes de começar.",
    choiceLegend: "Concordas?",
    agreeFallback: "Aceito participar.",
    declineFallback: "Prefiro não participar.",
    requiredFallback: "Escolhe uma antes de começar.",
  },
  tr: {
    name: "Onay",
    description:
      "Değerlendirmenin neyi kaydettiğini söyler ve başlamadan önce onay ister.",
    choiceLegend: "Kabul ediyor musun?",
    agreeFallback: "Katılmayı kabul ediyorum.",
    declineFallback: "Katılmamayı tercih ederim.",
    requiredFallback: "Başlamadan önce birini seç.",
  },
};
