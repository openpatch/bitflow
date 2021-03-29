// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en" | "de",
  {
    add: () => "Add Choice";
    "add-pattern": () => "Add Pattern";
    "checked-feedback": () => "Checked Feeedback";
    choice: (values: { option: string }) => string;
    "correct-choices": () => "Correct Choices";
    delete: () => "Delete";
    "delete-pattern": () => "Delete";
    down: () => "Down";
    error: () => "Error";
    info: () => "Info";
    instruction: () => "Instruction";
    "not-checked-feedback": () => "Not Checked Feedback";
    "one-choice-required": () => "At least one choice is required!";
    pattern: (values: { pattern: string }) => string;
    "pattern-error-duplicate": () => "A pattern can not contain duplicates";
    "pattern-error-exists": () => "This pattern already exists";
    "pattern-error-invalid": () => "Not a valid pattern";
    patterns: () => "Patterns";
    success: () => "Success";
    up: () => "Up";
    variant: () => "Variant";
    "variant-multiple": () => "Multiple";
    "variant-single": () => "Single";
    warning: () => "Warning";
  }
>({
  en: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    down: "Down",
    error: "Error",
    info: "Info",
    instruction: "Instruction",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  de: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    down: "Down",
    error: "Error",
    info: "Info",
    instruction: "Instruction",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
});

export default translations;
