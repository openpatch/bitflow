// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en" | "de",
  { message: () => "Message"; title: () => "Title" }
>({
  en: createLanguage({ message: "Message", title: "Title" }),
  de: createLanguage({ message: "Message", title: "Title" }),
});

export default translations;
