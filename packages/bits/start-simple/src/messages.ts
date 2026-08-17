import type { Catalogs } from "@bitflow/core";

export const messages: Catalogs = {
  en: {
    name: "Start",
    description: "The screen a learner sees before the assessment begins.",
    titleLabel: "Title",
    titleHint: "The name of the assessment, shown large.",
    markdownLabel: "Introduction",
    markdownHint:
      "What the learner needs to know before starting. Markdown is supported.",
  },
  de: {
    name: "Start",
    description: "Der Bildschirm vor dem Beginn des Tests.",
    titleLabel: "Titel",
    titleHint: "Der Name des Tests, groß dargestellt.",
    markdownLabel: "Einleitung",
    markdownHint:
      "Was vor dem Start bekannt sein sollte. Markdown ist möglich.",
  },
  fr: { name: "Début", description: "L'écran avant le début de l'évaluation." },
  nl: { name: "Start", description: "Het scherm voor de toets begint." },
  es: { name: "Inicio", description: "La pantalla antes de empezar." },
  it: { name: "Inizio", description: "La schermata prima dell'inizio." },
  pt: { name: "Início", description: "O ecrã antes de começar." },
  tr: { name: "Başlangıç", description: "Değerlendirme başlamadan önceki ekran." },
};
