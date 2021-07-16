// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en-GB" | "en" | "en-US" | "de",
  {
    description: () => " ";
    "example.message": () => "In this section you will be asked questions about **control structures**.";
    "example.title": () => "Section One";
    message: () => "Message";
    name: () => "Simple";
    title: () => "Title";
  }
>({
  "en-GB": createLanguage({
    description: " ",
    "example.message":
      "In this section you will be asked questions about **control structures**.",
    "example.title": "Section One",
    message: "Message",
    name: "Simple",
    title: "Title",
  }),
  en: createLanguage({
    description: " ",
    "example.message":
      "In this section you will be asked questions about **control structures**.",
    "example.title": "Section One",
    message: "Message",
    name: "Simple",
    title: "Title",
  }),
  "en-US": createLanguage({
    description: " ",
    "example.message":
      "In this section you will be asked questions about **control structures**.",
    "example.title": "Section One",
    message: "Message",
    name: "Simple",
    title: "Title",
  }),
  de: createLanguage({
    description: " ",
    "example.message":
      "In this section you will be asked questions about **control structures**.",
    "example.title": "Section One",
    message: "Message",
    name: "Simple",
    title: "Title",
  }),
});

export default translations;
