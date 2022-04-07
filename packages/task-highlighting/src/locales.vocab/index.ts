// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en-GB" | "en" | "en-US" | "de" | "fr" | "es" | "nl" | "pt" | "tr",
  {
    description: () => "A task bit for highlighting parts of a given text.";
    name: () => "Highlighting";
    instruction: () => "Instruction";
    text: () => "Text to Highlight";
    "example.instruction": () => "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'";
    "example.text": () => "Cale, Srawberry, Banana, Milk, Test";
    "severity.error": () => "Error";
    "severity.info": () => "Info";
    "severity.success": () => "Success";
    "severity.warning": () => "Warning";
    "highlight-title": (values: { id: number }) => string;
    maroon: () => "Maroon";
    yellow: () => "Yellow";
    orange: () => "Orange";
    blue: () => "Blue";
    lavender: () => "Lavender";
    "maroon-button": (values: { id: number }) => string;
    "yellow-button": (values: { id: number }) => string;
    "orange-button": (values: { id: number }) => string;
    "blue-button": (values: { id: number }) => string;
    "instruction-shortcodes": () => "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.";
    "instruction-enabled-highlight-colors": () => "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.";
    "lavender-button": (values: { id: number }) => string;
    "enabled-highlight-colors": () => "Enabled Highlight Colors";
    erase: () => "Erase";
    reset: () => "Reset";
    "erase-title": () => "Erase the highlight of the selected text by clicking this button or by pressing Delete";
    "reset-title": () => "Reset all highlights";
    solution: () => "Solution";
    "instruction-solution": () => "You can define a solution which will be used for evaluating the answers.";
    cutoffs: () => "Cutoffs";
    "instruction-cutoffs": () => "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.";
    "highlight-agreement": () => "Highlight Agreement";
    "highlight-agreement-description": () => "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.";
  }
>({
  "en-GB": createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  en: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  "en-US": createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  de: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  fr: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  es: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  nl: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  pt: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
  tr: createLanguage({
    description: "A task bit for highlighting parts of a given text.",
    name: "Highlighting",
    instruction: "Instruction",
    text: "Text to Highlight",
    "example.instruction":
      "Mark all fruits with '{{maroon}}' and all vegetables with '{{lavender}}'",
    "example.text": "Cale, Srawberry, Banana, Milk, Test",
    "severity.error": "Error",
    "severity.info": "Info",
    "severity.success": "Success",
    "severity.warning": "Warning",
    "highlight-title":
      "Highlight the selected text by clicking this button or by pressing {id, number}",
    maroon: "Maroon",
    yellow: "Yellow",
    orange: "Orange",
    blue: "Blue",
    lavender: "Lavender",
    "maroon-button": "Maroon ({id, number})",
    "yellow-button": "Yellow ({id, number})",
    "orange-button": "Orange ({id, number})",
    "blue-button": "Blue ({id, number})",
    "instruction-shortcodes":
      "You can use '{{color-name}}' in your instruction to display a smaller version of the button for this color. Options for color-name are: blue, lavender, maroon, orange and yellow.",
    "instruction-enabled-highlight-colors":
      "Here you can enabled multiple colors for the highlighting task. You can also give each color a custom name. The custom name does not influence the placeholder for the instruction.",
    "lavender-button": "Lavender ({id, number})",
    "enabled-highlight-colors": "Enabled Highlight Colors",
    erase: "Erase",
    reset: "Reset",
    "erase-title":
      "Erase the highlight of the selected text by clicking this button or by pressing Delete",
    "reset-title": "Reset all highlights",
    solution: "Solution",
    "instruction-solution":
      "You can define a solution which will be used for evaluating the answers.",
    cutoffs: "Cutoffs",
    "instruction-cutoffs":
      "For comparing your solution with an answer an agreement value will be calculated (Cohen's Kappa). You can define cutoff threshold for each highlight color. If the agreement value is above the cutoff score, the answer will be evaluated as correct. An agreement value of 1 means the answer and the solution are the same. An agreement value of 0 means nothing was highlighted. An agreement value of -1 means everything but the solution was highlighted. An answer will be regared as correct if all cutoffs are reached.",
    "highlight-agreement": "Highlight Agreement",
    "highlight-agreement-description":
      "If checked all correct highlighted areas will be marked in green and all wrong highlighted areas will be marked red.",
  }),
});

export default translations;