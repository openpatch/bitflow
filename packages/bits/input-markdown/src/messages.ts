import type { Catalogs } from "@bitflow/core";

export const messages: Catalogs = {
  en: {
    name: "Text",
    description: "A block of Markdown shown to the learner.",
    markdownLabel: "Text",
    markdownHint:
      "Markdown is supported: **bold**, lists, links, images and code.",
  },
  de: {
    name: "Text",
    description: "Ein Markdown-Textblock für die Lernenden.",
    markdownLabel: "Text",
    markdownHint:
      "Markdown ist möglich: **fett**, Listen, Links, Bilder und Code.",
  },
  fr: { name: "Texte", description: "Un bloc de Markdown pour l'apprenant." },
  nl: { name: "Tekst", description: "Een blok Markdown voor de leerling." },
  es: { name: "Texto", description: "Un bloque de Markdown para el estudiante." },
  it: { name: "Testo", description: "Un blocco di Markdown per lo studente." },
  pt: { name: "Texto", description: "Um bloco de Markdown para o aluno." },
  tr: { name: "Metin", description: "Öğrenciye gösterilen bir Markdown bloğu." },
};
