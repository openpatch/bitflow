import axe, { type Result } from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { loadBits } from "./bitLoaders";
import "./index";

/**
 * Automated accessibility checks over the real elements, with every bit
 * registered.
 *
 * They live here rather than in each bit package because this is the only
 * place the whole thing is assembled: a bit's markup is only accessible in
 * context — the label a task renders has to be unique on a page that also has
 * a progress bar, a countdown and a live region around it.
 *
 * jsdom has no layout, so the rules that need geometry — colour contrast,
 * target size, overlap — cannot run here and are disabled rather than passing
 * vacuously. What is left is the part that regresses silently: labels, roles,
 * names, heading order, ARIA that points at nothing.
 */

const RULES_NEEDING_LAYOUT = [
  "color-contrast",
  "target-size",
  "scrollable-region-focusable",
];

const check = async (element: Element): Promise<Result[]> => {
  const results = await axe.run(element, {
    rules: Object.fromEntries(
      RULES_NEEDING_LAYOUT.map((id) => [id, { enabled: false }]),
    ),
    resultTypes: ["violations"],
  });
  return results.violations;
};

/** Names the offending markup, since "1 violation" alone is not actionable. */
const describeViolations = (violations: Result[]): string =>
  violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n` +
        violation.nodes.map((node) => `  ${node.html}`).join("\n"),
    )
    .join("\n");

const expectAccessible = async (element: Element) => {
  const violations = await check(element);
  expect(describeViolations(violations)).toBe("");
};

const flush = async (times = 6) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

const waitFor = async (
  predicate: () => boolean,
  describe: () => string = () => "",
  attempts = 200,
) => {
  for (let i = 0; i < attempts; i++) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`timed out waiting for the element to settle. ${describe()}`);
};

const node = (id: string, type: string, data: Record<string, unknown>) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data,
});

const evaluation = { mode: "auto", enableRetry: true, showFeedback: true };

/** One of every task type, so each bit's own markup is covered. */
const steps = [
  node("start", "start-simple", {
    title: "A short quiz",
    markdown: "Four questions about capitals.",
  }),
  node("explain", "title-simple", {
    title: "Before you start",
    markdown: "Answer as well as you can.",
  }),
  node("q-yes-no", "task-yes-no", {
    question: "Is Paris the capital of France?",
    correctAnswer: true,
    evaluation,
  }),
  node("q-choice", "task-choice", {
    instruction: "Which of these are capitals?",
    variant: "multiple",
    choices: [
      { id: "c1", markdown: "Paris", correct: true },
      { id: "c2", markdown: "Lyon", correct: false },
    ],
    shuffle: false,
    partialCredit: false,
    evaluation,
    patternFeedback: [],
  }),
  node("q-input", "task-input", {
    instruction: "What is the capital of France?",
    matchMode: "exact",
    expected: ["Paris"],
    caseSensitive: false,
    evaluation,
    patternFeedback: [],
  }),
  node("q-blank", "task-fill-in-the-blank", {
    instruction: "Complete the sentence.",
    text: "The capital of France is [[1]].",
    blanks: { "1": ["Paris"] },
    caseSensitive: false,
    trim: true,
    partialCredit: true,
    evaluation,
  }),
  node("q-highlight", "task-highlighting", {
    instruction: "Mark the capital.",
    text: "Paris and Lyon",
    colors: { maroon: { enabled: true, label: "Capital" } },
    // One entry per character, so the reference matches the text's length.
    reference: [..."Paris and Lyon"].map((_, index) =>
      index < 5 ? ("maroon" as const) : null,
    ),
    evaluation,
  }),
  node("q-drag", "task-drag-drop", {
    instruction: "Label the diagram.",
    background: { src: "/cpu.png", alt: "A CPU diagram with its parts" },
    size: { width: 620, height: 310 },
    elements: [
      { id: "alu", kind: "text", label: "ALU", x: 0.02, y: 0.05, width: 0.2, height: 0.12 },
      { id: "reg", kind: "text", label: "Registers", x: 0.02, y: 0.25, width: 0.2, height: 0.12 },
    ],
    dropZones: [
      { id: "left", label: "Left block", x: 0.4, y: 0.05, width: 0.25, height: 0.25, correctElementIds: ["alu"] },
      { id: "right", label: "Right block", x: 0.7, y: 0.05, width: 0.25, height: 0.25, correctElementIds: ["reg"] },
    ],
    singlePoint: false,
    applyPenalties: true,
    evaluation,
  }),
  node("q-hotspot", "task-find-hotspots", {
    instruction: "Which of these is an input device?",
    background: { src: "data:image/png;base64,AAAA", alt: "A workstation" },
    size: { width: 620, height: 310 },
    hotspots: [
      { id: "keyboard", shape: "rect", x: 0.2, y: 0.6, width: 0.3, height: 0.2, correct: true, label: "The keyboard" },
      { id: "monitor", shape: "rect", x: 0.2, y: 0.1, width: 0.3, height: 0.3, correct: false, label: "The monitor" },
    ],
    evaluation,
  }),
  node("q-order", "task-ordering", {
    instruction: "Put the steps in order.",
    items: [
      { id: "a", kind: "text", label: "Read the input" },
      { id: "b", kind: "text", label: "Sort it" },
      { id: "c", kind: "text", label: "Print the result" },
    ],
    evaluation,
  }),
  node("q-match", "task-matching", {
    instruction: "Match each term to its meaning.",
    pairs: [
      {
        id: "cpu",
        left: { kind: "text", label: "CPU" },
        right: { kind: "text", label: "Carries out instructions" },
      },
      {
        id: "ram",
        left: { kind: "text", label: "RAM" },
        right: { kind: "text", label: "Holds what is being worked on" },
      },
    ],
    evaluation,
  }),
  node("q-parsons", "task-parsons", {
    instruction: "Arrange the lines to add up a list.",
    language: "python",
    lines: [
      { id: "total", text: "total = 0", indent: 0 },
      { id: "loop", text: "for value in values:", indent: 0 },
      { id: "add", text: "total += value", indent: 1 },
      { id: "stray", text: "print(values)", distractor: true },
    ],
    indentationMatters: true,
    penaliseDistractors: false,
    evaluation,
  }),
  node("q-crossword", "task-crossword", {
    instruction: "Fill in the grid from the clues.",
    words: [
      { id: "algorithm", clue: "A recipe a computer can follow", answer: "ALGORITHM", row: 0, column: 0, orientation: "down" },
      { id: "loop", clue: "Code that runs the same steps again and again", answer: "LOOP", row: 1, column: 0, orientation: "across" },
      { id: "binary", clue: "Counting with nothing but ones and zeros", answer: "BINARY", row: 3, column: 5, orientation: "down" },
      { id: "memory", clue: "Where a running program keeps what it is working on", answer: "MEMORY", row: 8, column: 0, orientation: "across" },
      { id: "input", clue: "What the user gives the program", answer: "INPUT", row: 5, column: 4, orientation: "across" },
      { id: "bug", clue: "A mistake in a program, named after an insect", answer: "BUG", row: 3, column: 5, orientation: "across" },
    ],
    scoring: "words",
    penaliseWrong: false,
    evaluation,
  }),
  node("q-wordsearch", "task-word-search", {
    instruction: "Eight words from computing are hidden in the grid.",
    rows: 12,
    columns: 12,
    letters:
      "LRBKTICWCBLAXJMCNDFSZIODIMDGHDJATNOJDIIRDPWGRAPHEVNQBLTRORCHYWWMBUXMSYAKQXPVZNVWFRAYEMMLPNAONKUDMMZGMOZJAMSVXAUWMDJYQAZSQIAEUEUQXMDEHOBMZGFJBNKZ",
    words: [
      { id: "word-array", text: "ARRAY", row: 2, column: 7, direction: "southEast" },
      { id: "word-loop", text: "LOOP", row: 0, column: 10, direction: "south" },
      { id: "word-stack", text: "STACK", row: 1, column: 7, direction: "southEast" },
      { id: "word-queue", text: "QUEUE", row: 10, column: 7, direction: "west" },
      { id: "word-binary", text: "BINARY", row: 0, column: 9, direction: "south" },
      { id: "word-node", text: "NODE", row: 7, column: 5, direction: "south" },
      { id: "word-graph", text: "GRAPH", row: 3, column: 7, direction: "east" },
      { id: "word-sort", text: "SORT", row: 5, column: 8, direction: "north" },
    ],
    directions: ["east", "south", "southEast", "north", "west"],
    showWords: true,
    evaluation,
  }),
  node("end", "end-tries", {
    title: "Finished",
    markdown: "Thank you.",
    showBreakdown: true,
    showScore: true,
    allowReview: true,
  }),
];

const flow = {
  version: 1,
  meta: {
    id: "a11y-flow",
    title: "A short quiz",
    locale: "en",
    askConfidence: true,
    askReasoning: true,
    timeLimit: 600,
  },
  nodes: steps,
  edges: steps
    .slice(1)
    .map((step, index) => ({
      id: `e${index}`,
      source: steps[index].id,
      target: step.id,
    })),
};

const mountFlow = async () => {
  const element = document.createElement("bitflow-flow") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { flow, locale: "en" });
  document.body.append(element);
  await flush();
  await waitFor(() => element.querySelectorAll("button").length > 0);
  return element;
};

const labelled = (element: Element, label: string) =>
  [...element.querySelectorAll("button")].find(
    (button) => button.textContent === label,
  );

afterEach(() => document.body.replaceChildren());

describe("accessibility", () => {
  it("checks the whole flow, one step at a time", async () => {
    const element = await mountFlow();
    const visited: string[] = [];

    // Every step, including the ones only reachable by answering, and both
    // states of a task — asked, and answered with feedback showing.
    for (let step = 0; step < steps.length; step++) {
      visited.push(steps[step].type);
      await expectAccessible(element);

      const check = labelled(element, "Check");
      if (check) {
        check.click();
        // Grading is async, and how long it takes is the bit's business —
        // waiting for the outcome beats guessing a number of ticks.
        await waitFor(
          () => labelled(element, "Check") === undefined,
          () => `${steps[step].type} never graded: ${element.textContent}`,
        );
        // Feedback, the confidence radios and the reasoning field all appear
        // only now, and all three are easy to leave unlabelled.
        await expectAccessible(element);
      }

      const next = labelled(element, "Next");
      // The end screen has no Next; anywhere else, a missing one means the
      // walk stalled and the steps after it were never checked.
      if (!next) {
        if (step === steps.length - 1) break;
        throw new Error(
          `stuck after ${steps[step].type}; buttons were ` +
            [...element.querySelectorAll("button")]
              .map((b) => `"${b.textContent}"`)
              .join(", "),
        );
      }
      next.click();
      await flush();
    }

    // Without this the test would still pass if the walk stopped at step one,
    // which is exactly how an accessibility suite quietly stops checking.
    expect(visited).toEqual(steps.map((step) => step.type));
  }, 30_000);

  it("checks a task mounted on its own", async () => {
    await loadBits(["task-choice"]);
    const element = document.createElement("bitflow-task-choice") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, {
      data: steps.find((step) => step.type === "task-choice")!.data,
      locale: "en",
    });
    document.body.append(element);
    await flush();
    await waitFor(() => element.querySelectorAll("input").length > 0);

    await expectAccessible(element);
  }, 15_000);

  it("checks the editor", async () => {
    const element = document.createElement("bitflow-flow-editor") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { flow, locale: "en" });
    document.body.append(element);
    await flush();
    await waitFor(() => element.querySelectorAll("button").length > 0);

    await expectAccessible(element);
  }, 30_000);
});
