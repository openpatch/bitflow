/**
 * One node of every bit type, and a flow made of them.
 *
 * Shared by the two accessibility suites rather than declared in one of them:
 * `a11y.test.ts` walks the flow as a learner, `formsA11y.test.tsx` renders each
 * bit's authoring form, and both need to cover every bit for the same reason.
 * They are separate files so MathLive — a lazy import with module-level state
 * that does not survive being mounted, unmounted and mounted again in jsdom —
 * is loaded once per suite rather than twice in one.
 */

export const node = (id: string, type: string, data: Record<string, unknown>) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data,
});

const evaluation = { mode: "auto", enableRetry: true, showFeedback: true };

/** One of every task type, so each bit's own markup is covered. */
export const steps = [
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
  node("q-numeric", "task-numeric", {
    instruction: "How far does light travel in one second?",
    expected: "2.998e8",
    tolerance: "percent",
    toleranceValue: 1,
    digits: 2,
    unitMode: "required",
    unit: "m",
    unitAlternatives: ["metres", "meters"],
    scoring: "valueAndUnit",
    decimalSeparator: "both",
    allowExpression: true,
    valueFeedback: [],
    evaluation,
  }),
  node("q-math", "task-math", {
    instruction: "Complete the identity.",
    latex: "(a+b)^2=\\placeholder[first]{}+2ab+\\placeholder[last]{}",
    blanks: {
      first: { expected: "a^2", accepted: [] },
      last: { expected: "b^2", accepted: [] },
    },
    compare: "symbolic",
    tolerance: 0,
    partialCredit: true,
    virtualKeyboard: true,
    blankFeedback: [],
    evaluation,
  }),
  node("q-mouse", "task-mouse-accuracy", {
    instruction: "Click each target as accurately as you can.",
    targets: [
      { id: "t1", x: 0.15, y: 0.25, radius: 0.07 },
      { id: "t2", x: 0.82, y: 0.3, radius: 0.045 },
      { id: "t3", x: 0.5, y: 0.75, radius: 0.09 },
      { id: "t4", x: 0.2, y: 0.8, radius: 0.035 },
      { id: "t5", x: 0.7, y: 0.15, radius: 0.06 },
    ],
    aspectRatio: 0.6,
    scoring: "hits",
    allowanceMs: 1500,
    allowOptOut: true,
    evaluation,
  }),
  node("q-typing", "task-keyboard-speed", {
    instruction: "Type the passage exactly as it appears.",
    text: "A keyboard is an input device: it turns what you press into characters, one at a time.",
    scoring: "accuracy",
    requiredAccuracy: 0.95,
    targetWpm: 25,
    timed: true,
    allowOptOut: true,
    evaluation,
  }),
  node("q-trace", "task-code-trace", {
    instruction: "Trace the loop.",
    language: "JavaScript",
    code: "let total = 0;\nfor (const v of [1, 2, 3]) total += v;\nprint(total);",
    showLineNumbers: true,
    columns: [
      { id: "total", name: "total", kind: "value" },
      { id: "printed", name: "printed so far", kind: "output" },
      { id: "next", name: "next line", kind: "line" },
    ],
    checkpoints: [
      {
        id: "before",
        label: "before the loop",
        line: 1,
        expected: { total: "0", printed: "", next: "2" },
      },
      {
        id: "after",
        label: "after the loop",
        line: 3,
        expected: { total: "6", printed: "", next: "3" },
      },
    ],
    caseSensitive: false,
    partialCredit: true,
    evaluation,
  }),
  node("q-graph", "task-graph-path", {
    instruction: "Find the cheapest route from A to D.",
    directed: false,
    weighted: true,
    nodes: [
      { id: "a", label: "A", x: 0.2, y: 0.25 },
      { id: "b", label: "B", x: 0.8, y: 0.25 },
      { id: "c", label: "C", x: 0.2, y: 0.8 },
      { id: "d", label: "D", x: 0.8, y: 0.8 },
    ],
    edges: [
      { id: "ab", source: "a", target: "b", weight: 1 },
      { id: "ac", source: "a", target: "c", weight: 4 },
      { id: "bc", source: "b", target: "c", weight: 2 },
      { id: "bd", source: "b", target: "d", weight: 1 },
      { id: "cd", source: "c", target: "d", weight: 5 },
    ],
    goal: "shortestPath",
    sourceId: "a",
    targetId: "d",
    traversal: "bfs",
    neighbourOrder: "label",
    partialCredit: true,
    evaluation,
  }),
  node("q-bits", "task-number-representation", {
    instruction: "Write the value in binary.",
    sourceRepresentation: "decimal",
    sourceValue: "42",
    targetRepresentation: "binary",
    bitWidth: 8,
    signed: false,
    allowPrefix: true,
    allowSeparators: true,
    requireFullWidth: true,
    scoring: "answer",
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

export const flow = {
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

