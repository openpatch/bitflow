import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Call stack",
    description: "A program and the call stack at a few moments of its run, written down frame by frame.",
    howTo:
      "For each moment, write down the calls waiting on the stack, the one running now on top. “Push” adds a frame on top, “Pop” takes the top one off. Each moment starts from the stack before it.",
    howToReadonly: "The stacks are shown as they were left.",
    codeLabel: "The program",
    codeLabelIn: "The program ({language})",
    unnamedMoment: "Moment {number}",
    atLine: "at line {line}",
    emptyStack: "The stack is empty.",
    stackLabel: "Stack at {moment}, top first",
    topFrame: "top frame",
    frameBelow: "frame {number} below the top",
    callLabel: "Call, {position}, {moment}",
    localsLabel: "Local variables, {position}, {moment}",
    callPlaceholder: "e.g. fak(3)",
    localsPlaceholder: "e.g. n = 3",
    push: "Push",
    pop: "Pop",
    pushed: "Frame pushed at {moment}; the stack is {height} high",
    popped: "Frame popped at {moment}; the stack is {height} high",
    correct: "correct",
    wrong: "wrong",
  },
  de: {
    name: "Aufrufstapel",
    description: "Ein Programm und der Aufrufstapel an einigen Stellen seines Ablaufs, Rahmen für Rahmen aufgeschrieben.",
    howTo:
      "Schreibe für jeden Zeitpunkt die wartenden Aufrufe auf den Stapel, den gerade laufenden oben. „Push“ legt einen Rahmen oben auf, „Pop“ nimmt den obersten weg. Jeder Zeitpunkt beginnt mit dem Stapel davor.",
    howToReadonly: "Die Stapel stehen so, wie sie gelassen wurden.",
    codeLabel: "Das Programm",
    codeLabelIn: "Das Programm ({language})",
    unnamedMoment: "Zeitpunkt {number}",
    atLine: "in Zeile {line}",
    emptyStack: "Der Stapel ist leer.",
    stackLabel: "Stapel bei {moment}, oben zuerst",
    topFrame: "oberster Rahmen",
    frameBelow: "Rahmen {number} unter dem obersten",
    callLabel: "Aufruf, {position}, {moment}",
    localsLabel: "Lokale Variablen, {position}, {moment}",
    callPlaceholder: "z. B. fak(3)",
    localsPlaceholder: "z. B. n = 3",
    push: "Push",
    pop: "Pop",
    pushed: "Rahmen bei {moment} aufgelegt; der Stapel ist {height} hoch",
    popped: "Rahmen bei {moment} entfernt; der Stapel ist {height} hoch",
    correct: "richtig",
    wrong: "falsch",
  },
};
