// This file is automatically generated by Vocab.
// To make changes update translation.json files directly.

import { createLanguage, createTranslationFile } from "@vocab/core/runtime";

const translations = createTranslationFile<
  "en" | "de",
  {
    "add-bit-task-first": () => "You need to add a task node first.";
    "add-input-portal-first": () => "You need to add an input portal first.";
    bit: () => "Bit";
    "bit-type-properties-invalid": () => "The properties of this bit are invalid. Take a lot at the errors.";
    "bit-type-unsupported": () => "Configuration of this bit type is currently unsupported.";
    checkpoint: () => "Checkpoint";
    "checkpoint-helper-text": () => "Stop students from going backwards";
    control: () => "Control";
    description: () => "Description";
    end: () => "End";
    "end-helper-text": () => "The last node in your flow";
    "end-markdown": () => "Markdown";
    "end-points": (values: { points: number; maxPoints: number }) => string;
    "end-properties-invalid": () => "End Node Properties are invalid.";
    "end-show-points": () => "Show Points";
    "end-show-results": () => "Show Results";
    errors: () => "Errors";
    evaluation: () => "Evaluation";
    "evaluation-enable-retry": () => "Enable retry";
    "evaluation-mode": () => "Mode";
    "evaluation-mode-auto": () => "Auto";
    "evaluation-mode-auto-helper-text": () => "Automatic evaluation";
    "evaluation-mode-manual": () => "Manual";
    "evaluation-mode-manual-helper-text": () => "Manual evaluation";
    "evaluation-mode-skip": () => "Skip";
    "evaluation-mode-skip-helper-text": () => "Skip evaluation";
    "evaluation-show-feedback": () => "Show feedback";
    feedback: () => "Feedback";
    "flow-properties": () => "Flow Properties";
    input: () => "Input";
    "input-markdown": () => "Markdown";
    key: () => "Key";
    meta: () => "Meta";
    name: () => "Name";
    "new-flow-title": () => "New Flow";
    "new-node-title": (values: { type: string }) => string;
    "node-no-properties": () => "Nothing to configure for this node";
    nodes: () => "Nodes";
    portal: () => "Portal";
    "portal-helper-text": () => "An input and an output portal are linked and act like a normal edge.";
    "portal-input": () => "Portal Input";
    "portal-output": () => "Portal Output";
    "portal-properties": () => "Portal Properties";
    preview: () => "Preview";
    privacy: () => "Privacy";
    "privacy-markdown": () => "Markdown";
    properties: () => "Properties";
    save: () => "Save";
    "select-node": () => "Select a node";
    "split-answer": () => "Split Answer";
    "split-answer-helper-text": () => "Students will be directed based on their answer";
    "split-answer-properties": () => "Split Answer Properties";
    "split-points": () => "Split Points";
    "split-points-helper-text": () => "Students will be directed based on their points";
    "split-points-properties": () => "Split Points Properties";
    "split-random": () => "Split Random";
    "split-random-helper-text": () => "Students will be directed randomly";
    "split-result": () => "Split Result";
    "split-result-helper-text": () => "Students will be directed based on their results";
    "split-result-properties": () => "Split Result Properties";
    start: () => "Start";
    "start-helper-text": () => "The first node in your flow";
    "start-markdown": () => "Markdown";
    "start-properties-invalid": () => "Start Node Properties are invalid.";
    "start-title": () => "Title";
    subtype: () => "Subtype";
    synchronize: () => "Synchronize";
    "synchronize-helper-text": () => "Force students to wait on your signal";
    task: () => "Task";
    "task-choice": () => "Choice";
    "task-fill-in-the-blank": () => "Fill in the blank";
    "task-input": () => "Input";
    title: () => "Title";
    "title-simple": () => "Simple";
    type: () => "Type";
    utility: () => "Utility";
    value: () => "Value";
    view: () => "View";
  }
>({
  en: createLanguage({
    "add-bit-task-first": "You need to add a task node first.",
    "add-input-portal-first": "You need to add an input portal first.",
    bit: "Bit",
    "bit-type-properties-invalid":
      "The properties of this bit are invalid. Take a lot at the errors.",
    "bit-type-unsupported":
      "Configuration of this bit type is currently unsupported.",
    checkpoint: "Checkpoint",
    "checkpoint-helper-text": "Stop students from going backwards",
    control: "Control",
    description: "Description",
    end: "End",
    "end-helper-text": "The last node in your flow",
    "end-markdown": "Markdown",
    "end-points":
      "{points, number} of {maxPoints} {maxPoints, plural, =0 {Points} one {Point} other {Points}}",
    "end-properties-invalid": "End Node Properties are invalid.",
    "end-show-points": "Show Points",
    "end-show-results": "Show Results",
    errors: "Errors",
    evaluation: "Evaluation",
    "evaluation-enable-retry": "Enable retry",
    "evaluation-mode": "Mode",
    "evaluation-mode-auto": "Auto",
    "evaluation-mode-auto-helper-text": "Automatic evaluation",
    "evaluation-mode-manual": "Manual",
    "evaluation-mode-manual-helper-text": "Manual evaluation",
    "evaluation-mode-skip": "Skip",
    "evaluation-mode-skip-helper-text": "Skip evaluation",
    "evaluation-show-feedback": "Show feedback",
    feedback: "Feedback",
    "flow-properties": "Flow Properties",
    input: "Input",
    "input-markdown": "Markdown",
    key: "Key",
    meta: "Meta",
    name: "Name",
    "new-flow-title": "New Flow",
    "new-node-title": "New {type}",
    "node-no-properties": "Nothing to configure for this node",
    nodes: "Nodes",
    portal: "Portal",
    "portal-helper-text":
      "An input and an output portal are linked and act like a normal edge.",
    "portal-input": "Portal Input",
    "portal-output": "Portal Output",
    "portal-properties": "Portal Properties",
    preview: "Preview",
    privacy: "Privacy",
    "privacy-markdown": "Markdown",
    properties: "Properties",
    save: "Save",
    "select-node": "Select a node",
    "split-answer": "Split Answer",
    "split-answer-helper-text":
      "Students will be directed based on their answer",
    "split-answer-properties": "Split Answer Properties",
    "split-points": "Split Points",
    "split-points-helper-text":
      "Students will be directed based on their points",
    "split-points-properties": "Split Points Properties",
    "split-random": "Split Random",
    "split-random-helper-text": "Students will be directed randomly",
    "split-result": "Split Result",
    "split-result-helper-text":
      "Students will be directed based on their results",
    "split-result-properties": "Split Result Properties",
    start: "Start",
    "start-helper-text": "The first node in your flow",
    "start-markdown": "Markdown",
    "start-properties-invalid": "Start Node Properties are invalid.",
    "start-title": "Title",
    subtype: "Subtype",
    synchronize: "Synchronize",
    "synchronize-helper-text": "Force students to wait on your signal",
    task: "Task",
    "task-choice": "Choice",
    "task-fill-in-the-blank": "Fill in the blank",
    "task-input": "Input",
    title: "Title",
    "title-simple": "Simple",
    type: "Type",
    utility: "Utility",
    value: "Value",
    view: "View",
  }),
  de: createLanguage({
    "add-bit-task-first": "You need to add a task node first.",
    "add-input-portal-first": "You need to add an input portal first.",
    bit: "Bit",
    "bit-type-properties-invalid":
      "The properties of this bit are invalid. Take a lot at the errors.",
    "bit-type-unsupported":
      "Configuration of this bit type is currently unsupported.",
    checkpoint: "Checkpoint",
    "checkpoint-helper-text": "Stop students from going backwards",
    control: "Control",
    description: "Description",
    end: "End",
    "end-helper-text": "The last node in your flow",
    "end-markdown": "Markdown",
    "end-points":
      "{points, number} of {maxPoints} {maxPoints, plural, =0 {Points} one {Point} other {Points}}",
    "end-properties-invalid": "End Node Properties are invalid.",
    "end-show-points": "Show Points",
    "end-show-results": "Show Results",
    errors: "Errors",
    evaluation: "Evaluation",
    "evaluation-enable-retry": "Enable retry",
    "evaluation-mode": "Mode",
    "evaluation-mode-auto": "Auto",
    "evaluation-mode-auto-helper-text": "Automatic evaluation",
    "evaluation-mode-manual": "Manual",
    "evaluation-mode-manual-helper-text": "Manual evaluation",
    "evaluation-mode-skip": "Skip",
    "evaluation-mode-skip-helper-text": "Skip evaluation",
    "evaluation-show-feedback": "Show feedback",
    feedback: "Feedback",
    "flow-properties": "Flow Properties",
    input: "Input",
    "input-markdown": "Markdown",
    key: "Key",
    meta: "Meta",
    name: "Name",
    "new-flow-title": "New Flow",
    "new-node-title": "New {type}",
    "node-no-properties": "Nothing to configure for this node",
    nodes: "Nodes",
    portal: "Portal",
    "portal-helper-text":
      "An input and an output portal are linked and act like a normal edge.",
    "portal-input": "Portal Input",
    "portal-output": "Portal Output",
    "portal-properties": "Portal Properties",
    preview: "Preview",
    privacy: "Privacy",
    "privacy-markdown": "Markdown",
    properties: "Properties",
    save: "Save",
    "select-node": "Select a node",
    "split-answer": "Split Answer",
    "split-answer-helper-text":
      "Students will be directed based on their answer",
    "split-answer-properties": "Split Answer Properties",
    "split-points": "Split Points",
    "split-points-helper-text":
      "Students will be directed based on their points",
    "split-points-properties": "Split Points Properties",
    "split-random": "Split Random",
    "split-random-helper-text": "Students will be directed randomly",
    "split-result": "Split Result",
    "split-result-helper-text":
      "Students will be directed based on their results",
    "split-result-properties": "Split Result Properties",
    start: "Start",
    "start-helper-text": "The first node in your flow",
    "start-markdown": "Markdown",
    "start-properties-invalid": "Start Node Properties are invalid.",
    "start-title": "Title",
    subtype: "Subtype",
    synchronize: "Synchronize",
    "synchronize-helper-text": "Force students to wait on your signal",
    task: "Task",
    "task-choice": "Choice",
    "task-fill-in-the-blank": "Fill in the blank",
    "task-input": "Input",
    title: "Title",
    "title-simple": "Simple",
    type: "Type",
    utility: "Utility",
    value: "Value",
    view: "View",
  }),
});

export default translations;
