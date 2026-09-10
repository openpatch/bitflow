import type { Catalogs } from "@bitflow/core";

/**
 * What the learner reads. Every locale complete — see `formMessages.ts` for
 * the authoring labels, which are English and German only.
 */
export const messages: Catalogs = {
  en: {
    name: "Who you are",
    description: "Asks the learner for a name or a class before the assessment starts.",
    legend: "About you",
    required: "Needed",
    choose: "Choose…",
    incomplete: "Fill in everything marked “Needed” before you start.",
    nameFallback: "Name",
  },
  de: {
    name: "Wer du bist",
    description: "Fragt vor dem Start nach Name oder Klasse.",
    legend: "Über dich",
    required: "Erforderlich",
    choose: "Bitte wählen …",
    incomplete: "Fülle alles mit „Erforderlich“ aus, bevor es losgeht.",
    nameFallback: "Name",
  },
  fr: {
    name: "Qui vous êtes",
    description: "Demande un nom ou une classe avant le début de l'évaluation.",
    legend: "À votre sujet",
    required: "Requis",
    choose: "Choisir…",
    incomplete: "Remplissez tout ce qui est marqué « Requis » avant de commencer.",
    nameFallback: "Nom",
  },
  nl: {
    name: "Wie je bent",
    description: "Vraagt om een naam of klas voordat de toets begint.",
    legend: "Over jou",
    required: "Verplicht",
    choose: "Kies…",
    incomplete: "Vul alles met „Verplicht” in voordat je begint.",
    nameFallback: "Naam",
  },
  es: {
    name: "Quién eres",
    description: "Pide un nombre o una clase antes de empezar la evaluación.",
    legend: "Sobre ti",
    required: "Obligatorio",
    choose: "Elige…",
    incomplete: "Rellena todo lo marcado como «Obligatorio» antes de empezar.",
    nameFallback: "Nombre",
  },
  it: {
    name: "Chi sei",
    description: "Chiede un nome o una classe prima dell'inizio della verifica.",
    legend: "Su di te",
    required: "Obbligatorio",
    choose: "Scegli…",
    incomplete: "Compila tutto ciò che è segnato «Obbligatorio» prima di iniziare.",
    nameFallback: "Nome",
  },
  pt: {
    name: "Quem és",
    description: "Pede um nome ou uma turma antes de o teste começar.",
    legend: "Sobre ti",
    required: "Obrigatório",
    choose: "Escolhe…",
    incomplete: "Preenche tudo o que está marcado como «Obrigatório» antes de começar.",
    nameFallback: "Nome",
  },
  tr: {
    name: "Kim olduğun",
    description: "Değerlendirme başlamadan önce ad veya sınıf sorar.",
    legend: "Senin hakkında",
    required: "Gerekli",
    choose: "Seç…",
    incomplete: "Başlamadan önce “Gerekli” işaretli her yeri doldur.",
    nameFallback: "Ad",
  },
};
