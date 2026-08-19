/**
 * One worked example per task type, for the gallery.
 *
 * Each is a real `data` object — the same thing a `.bitflow` file carries — so
 * the page is showing the task type rather than a mock-up of it, and the JSON
 * printed underneath is something an author could paste.
 *
 * Pictures are inline SVG data URIs. That keeps the demo free of assets and
 * shows the format as it really is: bitflow embeds images in the document
 * rather than linking them.
 */

const svg = (body: string, width = 620, height = 310) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`,
  )}`;

const workstation = svg(
  `<rect width="620" height="310" fill="#eef2f5"/>
   <rect x="180" y="25" width="260" height="150" rx="6" fill="#4a5568"/>
   <rect x="200" y="40" width="220" height="115" fill="#a0c4e8"/>
   <rect x="240" y="200" width="180" height="55" rx="6" fill="#cbd5e0"/>
   <ellipse cx="480" cy="230" rx="30" ry="42" fill="#cbd5e0"/>`,
);

const processor = svg(
  `<rect width="620" height="310" fill="#eef2f5"/>
   <rect x="248" y="20" width="150" height="80" rx="6" fill="#c9d6e0"/>
   <rect x="430" y="20" width="150" height="80" rx="6" fill="#c9d6e0"/>
   <text x="310" y="285" font-family="sans-serif" font-size="16" fill="#556">A processor</text>`,
);

const evaluation = {
  mode: "auto",
  enableRetry: true,
  showFeedback: true,
  weight: 1,
};

export type Example = {
  type: string;
  /** What this task type is for, in one line. */
  name: string;
  /** The capability the example is chosen to show. */
  shows: string;
  data: Record<string, unknown>;
};

export const examples: Example[] = [
  {
    type: "task-choice",
    name: "Choice",
    shows:
      "Several correct answers, part marks for a partly-right one, and feedback attached to a particular wrong choice.",
    data: {
      instruction: "Which of these are **prime** numbers?",
      variant: "multiple",
      choices: [
        { id: "c-2", markdown: "2", correct: true },
        {
          id: "c-9",
          markdown: "9",
          correct: false,
          feedbackWhenChecked: { message: "9 is 3 × 3.", severity: "info" },
        },
        { id: "c-13", markdown: "13", correct: true },
        { id: "c-21", markdown: "21", correct: false },
      ],
      shuffle: false,
      partialCredit: true,
      evaluation,
      patternFeedback: [],
    },
  },
  {
    type: "task-yes-no",
    name: "Yes / No",
    shows: "The smallest possible question, with a word back either way.",
    data: {
      question: "Is every prime number odd?",
      correctAnswer: false,
      feedbackWhenYes: {
        message: "2 is prime, and even — the only one.",
        severity: "info",
      },
      evaluation,
    },
  },
  {
    type: "task-input",
    name: "Short answer",
    shows:
      "Accepted alternatives, so a learner is not marked down for writing the same thing differently.",
    data: {
      instruction: "What is the capital of France?",
      matchMode: "exact",
      expected: ["Paris"],
      caseSensitive: false,
      trim: true,
      multiline: false,
      evaluation,
      patternFeedback: [],
    },
  },
  {
    type: "task-fill-in-the-blank",
    name: "Fill in the blank",
    shows: "Several gaps in one sentence, each with its own accepted answers.",
    data: {
      instruction: "Complete the sentence.",
      text: "A [[1]] number has exactly two factors: 1 and [[2]].",
      blanks: { "1": ["prime"], "2": ["itself", "the number itself"] },
      caseSensitive: false,
      trim: true,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-highlighting",
    name: "Highlighting",
    shows:
      "Marking up a text in colours, scored by agreement with the teacher's own marking rather than by exact overlap.",
    data: {
      instruction: "Mark the **cause** in yellow.",
      text: "The bridge collapsed because the bolts had rusted through.",
      colors: { yellow: { enabled: true, label: "cause" } },
      // "the bolts had rusted through" — characters 29 to the end.
      reference: [...Array(58)].map((_, i) => (i >= 29 ? "yellow" : null)),
      cutoffs: { yellow: 0.6 },
      evaluation,
    },
  },
  {
    type: "task-drag-drop",
    name: "Drag and drop",
    shows:
      "Elements dragged onto a picture and left exactly where they land. The target regions are invisible: touching one is enough, and a wrong placement costs a point.",
    data: {
      instruction: "Put each label on the block it names.",
      background: {
        src: processor,
        alt: "A processor with two unlabelled blocks",
      },
      size: { width: 620, height: 310 },
      elements: [
        {
          id: "alu",
          kind: "text",
          label: "ALU",
          x: 0.04,
          y: 0.6,
          width: 0.16,
          height: 0.15,
        },
        {
          id: "reg",
          kind: "text",
          label: "Registers",
          x: 0.26,
          y: 0.6,
          width: 0.2,
          height: 0.15,
        },
        {
          id: "cache",
          kind: "text",
          label: "Cache",
          x: 0.52,
          y: 0.6,
          width: 0.16,
          height: 0.15,
        },
      ],
      dropZones: [
        {
          id: "left",
          label: "Left block",
          x: 0.4,
          y: 0.06,
          width: 0.24,
          height: 0.26,
          tolerance: "touch",
          correctElementIds: ["alu"],
        },
        {
          id: "right",
          label: "Right block",
          x: 0.69,
          y: 0.06,
          width: 0.24,
          height: 0.26,
          tolerance: "touch",
          correctElementIds: ["reg"],
        },
      ],
      singlePoint: false,
      applyPenalties: true,
      evaluation,
    },
  },
  {
    type: "task-find-hotspots",
    name: "Find the spot",
    shows:
      "One click on a picture. The regions are never drawn, and a wrong one can explain itself.",
    data: {
      instruction: "Click the device you type on.",
      background: {
        src: workstation,
        alt: "A workstation with a monitor, a keyboard and a mouse",
      },
      size: { width: 620, height: 310 },
      hotspots: [
        {
          id: "keyboard",
          shape: "rect",
          x: 0.387,
          y: 0.645,
          width: 0.29,
          height: 0.177,
          correct: true,
          label: "The keyboard",
          feedback: "Yes — the keyboard is how text gets in.",
        },
        {
          id: "monitor",
          shape: "rect",
          x: 0.29,
          y: 0.08,
          width: 0.419,
          height: 0.484,
          correct: false,
          label: "The monitor",
          feedback: "That is the monitor. It shows output rather than taking it in.",
        },
        {
          id: "mouse",
          shape: "ellipse",
          x: 0.726,
          y: 0.606,
          width: 0.097,
          height: 0.271,
          correct: false,
          label: "The mouse",
          feedback: "The mouse is an input device, but not the one you type on.",
        },
      ],
      missFeedback: "Nothing there — look for the thing with keys on it.",
      evaluation,
    },
  },
  {
    type: "task-ordering",
    name: "Put in order",
    shows:
      "Dragging with the item held under the cursor and a gap opening where it will land — or the arrow keys, which do the same thing.",
    data: {
      instruction: "Put the steps of a bubble sort in order.",
      items: [
        { id: "a", kind: "text", label: "Read the list" },
        { id: "b", kind: "text", label: "Compare each neighbouring pair" },
        {
          id: "c",
          kind: "text",
          label: "Swap them if they are the wrong way round",
        },
        { id: "d", kind: "text", label: "Repeat until no swaps happen" },
        { id: "e", kind: "text", label: "Print the sorted list" },
      ],
      evaluation,
    },
  },
  {
    type: "task-matching",
    name: "Match up",
    shows:
      "Two columns shuffled apart, a point per pair, and nothing lost for a card left alone.",
    data: {
      instruction: "Match each part of the computer to what it does.",
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
        {
          id: "disk",
          left: { kind: "text", label: "Disk" },
          right: { kind: "text", label: "Keeps things when the power is off" },
        },
      ],
      evaluation,
    },
  },
  {
    type: "task-parsons",
    name: "Parsons puzzle",
    shows:
      "Code lines to put back in order, with a line that belongs nowhere among them and the nesting to get right as well. Every move is a keystroke as much as a click.",
    data: {
      instruction: "Arrange the lines so the program adds up a list of numbers.",
      language: "python",
      lines: [
        { id: "total", text: "total = 0", indent: 0 },
        { id: "loop", text: "for value in values:", indent: 0 },
        { id: "add", text: "total += value", indent: 1 },
        { id: "print", text: "print(total)", indent: 0 },
        { id: "stray", text: "values.sort()", distractor: true },
      ],
      indentationMatters: true,
      penaliseDistractors: false,
      evaluation,
    },
  },
  {
    type: "task-crossword",
    name: "Crossword",
    shows:
      "A grid built from the answers themselves — the same clue list always lays out the same way. Type in a square or write the whole answer beside its clue.",
    data: {
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
    },
  },
  {
    type: "task-word-search",
    name: "Find the words",
    shows:
      "A letter grid built from the words themselves, with filler that never spells one of them by accident. Drag along a word, or find it with the arrow keys and Enter.",
    data: {
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
    },
  },
  {
    type: "task-numeric",
    name: "Number",
    shows:
      "A number, or a calculation that comes to one \u2014 3/4 and 0.75 are the same answer. It says what it makes of what you typed, so nobody is marked on a figure they cannot see. Tolerance, significant figures and units, and no eval anywhere near it.",
    data: {
      instruction:
        "How far does light travel in one second? Give your answer in metres, to within 1%.",
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
      valueFeedback: [
        {
          value: "3e5",
          feedback: {
            message: "That is the speed in kilometres per second.",
            severity: "info",
          },
        },
      ],
      evaluation,
    },
  },
  {
    type: "task-math",
    name: "Maths",
    shows:
      "An answer written as maths and compared as maths: 2x, x\u00b72 and 2\u00d7x are one answer. The formula is the question and the gaps are the answer, and each gap is marked where it stands.",
    data: {
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
      blankFeedback: [
        {
          blank: "first",
          latex: "a",
          feedback: {
            message: "Nearly — the first term is a squared, not a.",
            severity: "info",
          },
        },
      ],
      evaluation,
    },
  },
  {
    type: "task-mouse-accuracy",
    name: "Pointing accuracy",
    shows:
      "Targets one at a time, timed and measured — the data Fitts's law is about. It says it needs a pointing device before it starts, and lets the learner stand down.",
    data: {
      instruction: "Click each target as accurately as you can.",
      targets: [
        { id: "t1", x: 0.15, y: 0.25, radius: 0.07 },
        { id: "t2", x: 0.82, y: 0.3, radius: 0.045 },
        { id: "t3", x: 0.5, y: 0.75, radius: 0.09 },
        { id: "t4", x: 0.2, y: 0.8, radius: 0.035 },
        { id: "t5", x: 0.7, y: 0.15, radius: 0.06 },
      ],
      aspectRatio: 0.6,
      scoring: "hitsAndSpeed",
      allowanceMs: 1500,
      allowOptOut: true,
      evaluation,
    },
  },
  {
    type: "task-keyboard-speed",
    name: "Typing",
    shows:
      "A passage marked character by character as it is passed, timed from the first keystroke. The text is read off the box, never off the keys, so an input method works and no key log exists to keep.",
    data: {
      instruction: "Type the passage exactly as it appears.",
      text: 
        "A keyboard is an input device: it turns what you press into characters, one at a time.",
      scoring: "accuracyAndSpeed",
      requiredAccuracy: 0.95,
      targetWpm: 25,
      timed: true,
      allowOptOut: true,
      evaluation,
    },
  },
  {
    type: "task-code-trace",
    name: "Code trace",
    shows:
      "A program shown as text and a trace table beside it: values, the output so far, and which line runs next. The code is never executed \u2014 the author writes the states down, and marking is arithmetic over those.",
    data: {
      instruction: "Work through the loop and fill in the table.",
      language: "Python",
      code:
        "total = 0\nfor value in [3, 1, 4]:\n    total += value\n    print(total)\nprint('done')",
      showLineNumbers: true,
      columns: [
        { id: "value", name: "value", kind: "value" },
        { id: "total", name: "total", kind: "value" },
        { id: "printed", name: "printed so far", kind: "output" },
        { id: "next", name: "next line", kind: "line" },
      ],
      checkpoints: [
        {
          id: "start",
          label: "before the loop",
          line: 1,
          expected: { value: "", total: "0", printed: "", next: "2" },
        },
        {
          id: "first",
          label: "end of the first pass",
          line: 4,
          expected: { value: "3", total: "3", printed: "3", next: "2" },
        },
        {
          id: "second",
          label: "end of the second pass",
          line: 4,
          expected: { value: "1", total: "4", printed: "3 4", next: "2" },
        },
        {
          id: "end",
          label: "after the loop",
          line: 5,
          expected: { value: "4", total: "8", printed: "3 4 8", next: "5" },
        },
      ],
      caseSensitive: false,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-graph-path",
    name: "Graph path",
    shows:
      "A weighted graph and the cheapest route through it. Dijkstra runs in the page, so every equally cheap route is right without the author listing one \u2014 and the same bit asks for a traversal order, a spanning tree or a cut.",
    data: {
      instruction:
        "Find the **cheapest route** from A to F. Choose the places in order.",
      directed: false,
      weighted: true,
      nodes: [
        { id: "a", label: "A", x: 0.1, y: 0.5 },
        { id: "b", label: "B", x: 0.35, y: 0.15 },
        { id: "c", label: "C", x: 0.35, y: 0.85 },
        { id: "d", label: "D", x: 0.65, y: 0.15 },
        { id: "e", label: "E", x: 0.65, y: 0.85 },
        { id: "f", label: "F", x: 0.9, y: 0.5 },
      ],
      edges: [
        { id: "ab", source: "a", target: "b", weight: 2 },
        { id: "ac", source: "a", target: "c", weight: 4 },
        { id: "bd", source: "b", target: "d", weight: 5 },
        { id: "bc", source: "b", target: "c", weight: 1 },
        { id: "ce", source: "c", target: "e", weight: 3 },
        { id: "de", source: "d", target: "e", weight: 1 },
        { id: "df", source: "d", target: "f", weight: 2 },
        { id: "ef", source: "e", target: "f", weight: 4 },
      ],
      goal: "shortestPath",
      sourceId: "a",
      targetId: "f",
      traversal: "bfs",
      neighbourOrder: "label",
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-number-representation",
    name: "Number representation",
    shows:
      "The same value written again another way, marked arithmetically: 2A, 2a and 0x2A are one answer. The width and the sign belong to the value, so \u221242 and 11010110 are the same eight bits.",
    data: {
      instruction:
        "Write **\u221242** as an eight-bit two's complement pattern.",
      sourceRepresentation: "decimal",
      sourceValue: "-42",
      targetRepresentation: "binary",
      bitWidth: 8,
      signed: true,
      allowPrefix: true,
      allowSeparators: true,
      requireFullWidth: true,
      scoring: "digits",
      evaluation,
    },
  },
];

export const exampleFor = (type: string | null): Example =>
  examples.find((example) => example.type === type) ?? examples[0];
