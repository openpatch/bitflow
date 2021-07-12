// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en-GB" | "en" | "en-US" | "de",
  {
    description: () => " ";
    markdown: () => "Markdown";
    name: () => "Tries";
    points: (values: { points: number; maxPoints: number }) => string;
  }
>({
  "en-GB": createLanguage({
    description: " ",
    markdown: "Markdown",
    name: "Tries",
    points:
      "{points, number} of {maxPoints} {maxPoints, plural, =0 {Points} one {Point} other {Points}}",
  }),
  en: createLanguage({
    description: " ",
    markdown: "Markdown",
    name: "Tries",
    points:
      "{points, number} of {maxPoints} {maxPoints, plural, =0 {Points} one {Point} other {Points}}",
  }),
  "en-US": createLanguage({
    description: " ",
    markdown: "Markdown",
    name: "Tries",
    points:
      "{points, number} of {maxPoints} {maxPoints, plural, =0 {Points} one {Point} other {Points}}",
  }),
  de: createLanguage({
    description: " ",
    markdown: "Markdown",
    name: "Tries",
    points:
      "{points, number} of {maxPoints} {maxPoints, plural, =0 {Points} one {Point} other {Points}}",
  }),
});

export default translations;
