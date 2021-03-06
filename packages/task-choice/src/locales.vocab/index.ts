// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en-GB" | "en" | "en-US" | "de" | "fr" | "es" | "nl" | "pt" | "tr",
  {
    add: () => "Add Choice";
    "add-pattern": () => "Add Pattern";
    "checked-feedback": () => "Checked Feeedback";
    choice: (values: { option: string }) => string;
    "correct-choices": () => "Correct Choices";
    delete: () => "Delete";
    "delete-pattern": () => "Delete";
    description: () => "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.";
    down: () => "Down";
    error: () => "Error";
    "example.choice.a": () => "Sumatra";
    "example.choice.b": () => "Java";
    "example.choice.c": () => "Cobra";
    "example.choice.d": () => "Python";
    "example.feedback.a.checked": () => "This is only an island.";
    "example.feedback.b.notChecked": () => "This is not only an island, but also a programming language.";
    "example.feedback.pattern.ac": () => "It is a trap.";
    "example.instruction": () => "Which of the following are programming languages?";
    info: () => "Info";
    instruction: () => "Instruction";
    name: () => "Choice";
    "not-checked-feedback": () => "Not Checked Feedback";
    "one-choice-required": () => "At least one choice is required!";
    pattern: (values: { pattern: string }) => string;
    "pattern-error-duplicate": () => "A pattern can not contain duplicates";
    "pattern-error-exists": () => "This pattern already exists";
    "pattern-error-invalid": () => "Not a valid pattern";
    patterns: () => "Patterns";
    "statistic-patterns-description": () => "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.";
    success: () => "Success";
    up: () => "Up";
    variant: () => "Variant";
    "variant-multiple": () => "Multiple";
    "variant-single": () => "Single";
    warning: () => "Warning";
  }
>({
  "en-GB": createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  en: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  "en-US": createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
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
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  fr: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  es: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  nl: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  pt: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
  tr: createLanguage({
    add: "Add Choice",
    "add-pattern": "Add Pattern",
    "checked-feedback": "Checked Feeedback",
    choice: "Choice {option}",
    "correct-choices": "Correct Choices",
    delete: "Delete",
    "delete-pattern": "Delete",
    description:
      "A task bit allowing to create single or multiple choice questions. The answers of users can be automatically evaluated. Also feedback can be given based on the answer pattern.",
    down: "Down",
    error: "Error",
    "example.choice.a": "Sumatra",
    "example.choice.b": "Java",
    "example.choice.c": "Cobra",
    "example.choice.d": "Python",
    "example.feedback.a.checked": "This is only an island.",
    "example.feedback.b.notChecked":
      "This is not only an island, but also a programming language.",
    "example.feedback.pattern.ac": "It is a trap.",
    "example.instruction": "Which of the following are programming languages?",
    info: "Info",
    instruction: "Instruction",
    name: "Choice",
    "not-checked-feedback": "Not Checked Feedback",
    "one-choice-required": "At least one choice is required!",
    pattern: "Pattern {pattern}",
    "pattern-error-duplicate": "A pattern can not contain duplicates",
    "pattern-error-exists": "This pattern already exists",
    "pattern-error-invalid": "Not a valid pattern",
    patterns: "Patterns",
    "statistic-patterns-description":
      "Here you can see the frequency of the patterns. Green highlighted patterns are correct ones, which match the evaluation pattern. If you hover of a pattern you can see the choices.",
    success: "Success",
    up: "Up",
    variant: "Variant",
    "variant-multiple": "Multiple",
    "variant-single": "Single",
    warning: "Warning",
  }),
});

export default translations;
