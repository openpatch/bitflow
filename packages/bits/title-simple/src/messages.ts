import type { Catalogs } from "@bitflow/core";

export const messages: Catalogs = {
  en: {
    name: "Explanation",
    description: "A titled screen of text between tasks.",
    titleLabel: "Heading",
    titleHint: "Optional. Leave empty for text on its own.",
    markdownLabel: "Text",
    markdownHint: "Markdown is supported.",
  },
  de: {
    name: "Erklärung",
    description: "Ein Textbildschirm mit Überschrift zwischen Aufgaben.",
    titleLabel: "Überschrift",
    titleHint: "Optional. Leer lassen für Text ohne Überschrift.",
    markdownLabel: "Text",
    markdownHint: "Markdown ist möglich.",
  },
  fr: { name: "Explication", description: "Un écran de texte entre les exercices." },
  nl: { name: "Uitleg", description: "Een tekstscherm tussen de opdrachten." },
  es: { name: "Explicación", description: "Una pantalla de texto entre tareas." },
  it: { name: "Spiegazione", description: "Una schermata di testo fra gli esercizi." },
  pt: { name: "Explicação", description: "Um ecrã de texto entre tarefas." },
  tr: { name: "Açıklama", description: "Görevler arasında bir metin ekranı." },
};
