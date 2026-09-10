import type { Catalogs } from "@bitflow/core";

/**
 * The labels on this step's authoring form. English and German only, and
 * complete in both — see `messages.ts`.
 */
export const formMessages: Catalogs = {
  en: {
    titleLabel: "Title",
    titleHint: "The name of the assessment, shown large.",
    markdownLabel: "Introduction",
    markdownHint:
      "What the learner needs to know before starting. Markdown is supported.",
    showOutlineLabel: "Show what is ahead",
    showOutlineHint:
      "Roughly how many questions, the time limit, and whether they can go back. Worked out from the assessment itself, so it cannot go out of date.",
  },
  de: {
    titleLabel: "Titel",
    titleHint: "Der Name des Tests, groß dargestellt.",
    markdownLabel: "Einleitung",
    markdownHint: "Was vor dem Start bekannt sein sollte. Markdown ist möglich.",
    showOutlineLabel: "Zeigen, was bevorsteht",
    showOutlineHint:
      "Ungefähre Anzahl der Aufgaben, das Zeitlimit und ob man zurück kann. Wird aus dem Test selbst berechnet und kann darum nicht veralten.",
  },
};
