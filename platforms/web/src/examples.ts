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

const cell = svg(
  `<rect width="620" height="310" fill="#eef2f5"/>
   <ellipse cx="310" cy="155" rx="230" ry="120" fill="#dbe7d4" stroke="#7f9c6d" stroke-width="3"/>
   <ellipse cx="270" cy="140" rx="55" ry="45" fill="#9fb8d8" stroke="#4a6d99" stroke-width="3"/>
   <circle cx="420" cy="200" r="22" fill="#c8b6d8" stroke="#7a5c99" stroke-width="3"/>
   <circle cx="180" cy="215" r="16" fill="#e0c9a6" stroke="#a3854f" stroke-width="3"/>`,
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
  {
    type: "task-free-text",
    name: "Written answer",
    shows:
      "A few sentences, kept whole for a person to read. The learner is told before they write whether a person or a word list is going to look at it, and an answer waiting for a reader scores nothing out of nothing rather than pretending to a mark.",
    data: {
      instruction: "Why does binary search need the list to be sorted?",
      placeholder: "",
      marking: "keywords",
      minimumLength: 80,
      maximumLength: 600,
      criteria: [
        {
          id: "sorted",
          label: "Says the list has to be in order",
          keywords: ["sorted", "order", "ordered"],
          points: 1,
        },
        {
          id: "halve",
          label: "Says half the list is ruled out each time",
          keywords: ["half", "halve", "halves", "middle"],
          points: 1,
        },
        {
          id: "compare",
          label: "Says the comparison tells you which half",
          keywords: ["compare", "compares", "comparing", "comparison", "bigger", "smaller"],
          points: 1,
        },
      ],
      modelAnswer:
        "Comparing with the middle value only tells you which side to keep if everything on one side is smaller and everything on the other is larger. Without that, ruling out half the list would rule out the answer.",
      caseSensitive: false,
      evaluation,
    },
  },
  {
    type: "task-boolean-logic",
    name: "Truth table",
    shows:
      "A truth table worked out from the expression rather than from a stored answer key, so the table cannot disagree with the heading above it. The author types the expression the way it is written on a board; nothing is executed.",
    data: {
      instruction:
        "Fill in the table for **A \u2227 \u00acB**. The middle column is done for you.",
      variables: ["A", "B"],
      columns: [
        {
          id: "notb",
          label: "",
          expression: { kind: "not", value: { kind: "variable", name: "B" } },
          given: true,
        },
        {
          id: "out",
          label: "",
          expression: {
            kind: "and",
            left: { kind: "variable", name: "A" },
            right: { kind: "not", value: { kind: "variable", name: "B" } },
          },
          given: false,
        },
      ],
      rowOrder: "standard",
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-image-annotation",
    name: "Mark the picture",
    shows:
      "The learner puts their own marks on the picture, and where they landed is the answer \u2014 no candidate regions to choose between, so it cannot be answered by elimination. The crosshair moves with the arrow keys, so a keyboard aims exactly as freely as a pointer.",
    data: {
      instruction: "Mark the nucleus and the two vacuoles.",
      background: { src: cell, alt: "A plant cell seen through a microscope" },
      size: { width: 620, height: 310 },
      annotationKind: "point",
      maximumCount: 3,
      requireLabel: false,
      regions: [
        {
          id: "nucleus",
          kind: "circle",
          x: 0.435,
          y: 0.452,
          radius: 0.09,
          width: 0.2,
          height: 0.2,
          label: "the nucleus",
          acceptedLabels: [],
        },
        {
          id: "vacuole-1",
          kind: "circle",
          x: 0.677,
          y: 0.645,
          radius: 0.06,
          width: 0.2,
          height: 0.2,
          label: "the larger vacuole",
          acceptedLabels: [],
        },
        {
          id: "vacuole-2",
          kind: "circle",
          x: 0.29,
          y: 0.694,
          radius: 0.055,
          width: 0.2,
          height: 0.2,
          label: "the smaller vacuole",
          acceptedLabels: [],
        },
      ],
      overlap: 0.5,
      penaliseExtras: false,
      caseSensitive: false,
      evaluation,
    },
  },
  {
    type: "task-array-steps",
    name: "Algorithm steps",
    shows:
      "The learner writes down the array after each pass of an algorithm, by swapping boxes with two taps \u2014 no dragging, so it works the same with a thumb as with a mouse. Each pass starts from the learner's own previous one, and is marked on its own.",
    data: {
      instruction: "Sort the array with **bubble sort**. Show the array after each of the first two passes.",
      initial: ["5", "2", "8", "1", "9"],
      steps: [
        { id: "p1", label: "After pass 1", expected: ["2", "5", "1", "8", "9"] },
        { id: "p2", label: "After pass 2", expected: ["2", "1", "5", "8", "9"] },
      ],
      mode: "rearrange",
      showIndices: true,
      caseSensitive: false,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-binary-tree",
    name: "Binary tree",
    shows:
      "A traversal answered by tapping the places in order. The right order is worked out from the tree, never stored beside it, so editing a key can never leave a stale answer key behind. The same bit searches a search tree and inserts keys into one.",
    data: {
      instruction: "In which order does a **postorder** traversal visit the places?",
      mode: "traversal",
      traversal: "postorder",
      tree: {
        root: "n8",
        nodes: [
          { id: "n8", label: "8", left: "n3", right: "n10" },
          { id: "n3", label: "3", left: "n1", right: "n6" },
          { id: "n1", label: "1" },
          { id: "n6", label: "6", left: "n4", right: "n7" },
          { id: "n4", label: "4" },
          { id: "n7", label: "7" },
          { id: "n10", label: "10", right: "n14" },
          { id: "n14", label: "14" },
        ],
      },
      searchKey: "",
      insertKeys: [],
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-pixel-grid",
    name: "Pixel grid",
    shows:
      "A PBM listing turned back into a picture: the learner paints the grid with a tap or a drag, and every free cell is marked against the picture the author painted.",
    data: {
      instruction:
        "Paint the picture this PBM file describes.\n\n```\nP1\n5 5\n0 0 1 0 0\n0 1 0 1 0\n1 1 1 1 1\n1 0 0 0 1\n1 0 1 0 1\n```",
      rows: 5,
      columns: 5,
      palette: [
        { id: "white", color: "#ffffff", label: "0" },
        { id: "black", color: "#000000", label: "1" },
      ],
      target: [
        ["white", "white", "black", "white", "white"],
        ["white", "black", "white", "black", "white"],
        ["black", "black", "black", "black", "black"],
        ["black", "white", "white", "white", "black"],
        ["black", "white", "black", "white", "black"],
      ],
      given: [],
      startColor: "white",
      showCoordinates: true,
      showLabels: true,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-table",
    name: "Fill in the table",
    shows:
      "A query result predicted without running anything. The rows may be typed in any order, because a query without ORDER BY does not promise one \u2014 each row is marked against the answer row it matches best.",
    data: {
      instruction:
        "What does this query return?\n\n```sql\nSELECT name, city FROM pupils WHERE age > 15\n```\n\n| name | age | city |\n|---|---|---|\n| Ada | 16 | London |\n| Alan | 15 | Wilmslow |\n| Grace | 17 | New York |",
      caption: "Result",
      columns: [
        { id: "name", header: "name", kind: "text" },
        { id: "city", header: "city", kind: "text" },
      ],
      rows: [
        { id: "r1", cells: { name: { accepted: ["Ada"] }, city: { accepted: ["London"] } } },
        { id: "r2", cells: { name: { accepted: ["Grace"] }, city: { accepted: ["New York"] } } },
      ],
      rowHeaders: false,
      rowOrder: "any",
      caseSensitive: false,
      ignoreWhitespace: true,
      numberTolerance: 0,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-point-plot",
    name: "Classify points",
    shows:
      "One step of k-means done by hand: each open point goes to the centre it sits closest to. Classes differ in shape as well as colour, and every open point can also be answered from a list under the plot.",
    data: {
      instruction: "Assign every open point to the cluster whose **centre** is nearest.",
      axes: {
        x: { label: "Hours of sleep", min: 0, max: 10 },
        y: { label: "Hours online", min: 0, max: 10 },
      },
      classes: [
        { id: "a", label: "Cluster A", color: "#017460", shape: "circle" },
        { id: "b", label: "Cluster B", color: "#a3282d", shape: "square" },
      ],
      points: [
        { id: "ca", x: 7, y: 3, class: "a", centroid: true },
        { id: "cb", x: 4, y: 7, class: "b", centroid: true },
        { id: "p1", x: 8, y: 2, expected: "a" },
        { id: "p2", x: 6, y: 4, expected: "a" },
        { id: "p3", x: 3, y: 8, expected: "b" },
        { id: "p4", x: 5, y: 6, expected: "b" },
        { id: "p5", x: 6, y: 5, expected: "a" },
      ],
      showGrid: true,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-call-stack",
    name: "Call stack",
    shows:
      "The stack of a recursive call written down frame by frame, the running call on top. A frame is pushed and popped, the two things a program does to a stack, so the answer cannot be an order no run could produce. The code is shown and never run.",
    data: {
      instruction: "`fak(3)` has just been called. Write down the stack at each moment, with each call's `n`.",
      language: "Java",
      code: "int fak(int n) {\n  if (n <= 1) {\n    return 1;\n  }\n  return n * fak(n - 1);\n}",
      showLineNumbers: true,
      showLocals: true,
      checkpoints: [
        {
          id: "m1",
          label: "fak(2) is called",
          line: 5,
          expected: [
            { call: "fak(2)", locals: "n = 2" },
            { call: "fak(3)", locals: "n = 3" },
          ],
        },
        {
          id: "m2",
          label: "The base case is reached",
          line: 3,
          expected: [
            { call: "fak(1)", locals: "n = 1" },
            { call: "fak(2)", locals: "n = 2" },
            { call: "fak(3)", locals: "n = 3" },
          ],
        },
      ],
      caseSensitive: false,
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-cardinality",
    name: "Cardinalities",
    shows:
      "The step of data modelling that is about reading a situation, not drawing: the author draws the entities and relationships, the learner labels the ends. Chen's n and m both count as many, since they only keep the two ends apart.",
    data: {
      instruction:
        "A pupil can borrow several books at once. A book is lent to at most one pupil at a time. A teacher tutors several pupils; a pupil has one tutor.",
      notation: "chen",
      entities: [
        { id: "teacher", name: "Teacher", x: 0.2, y: 0.25 },
        { id: "pupil", name: "Pupil", x: 0.2, y: 0.75 },
        { id: "book", name: "Book", x: 0.8, y: 0.75 },
      ],
      relationships: [
        { id: "borrows", name: "borrows", from: "pupil", to: "book", expectedFrom: "1", expectedTo: "n" },
        { id: "tutors", name: "tutors", from: "teacher", to: "pupil", expectedFrom: "1", expectedTo: "n" },
      ],
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-number-line",
    name: "Number line",
    shows:
      "Values placed on a number line by choosing one and tapping where it goes, then nudged by dragging or with the arrow keys. Each is marked by how close it lands, and the right place is shown beside a wrong one afterwards.",
    data: {
      instruction: "Place **1/2**, **−3/4** and **1.25** on the number line.",
      min: -2,
      max: 2,
      tickStep: 1,
      minorTicks: 3,
      labelTicks: true,
      items: [
        { id: "a", label: "1/2", value: 0.5 },
        { id: "b", label: "-3/4", value: -0.75 },
        { id: "c", label: "1.25", value: 1.25 },
      ],
      tolerance: 0.25,
      snap: "minor",
      partialCredit: true,
      evaluation,
    },
  },
  {
    type: "task-function-plot",
    name: "Sketch the graph",
    shows:
      "A derivative sketched from the function shown: the learner sets the value at a few x positions, by tapping, dragging or typing, and each is marked against the function the author wrote. The function is text in a small arithmetic grammar; nothing is ever run as code.",
    data: {
      instruction: "Here is **f(x) = x²**. Sketch its derivative **f′**.",
      axes: {
        x: { label: "x", min: -3, max: 3, step: 1 },
        y: { label: "y", min: -7, max: 7, step: 1 },
      },
      target: "2x",
      shown: [{ expression: "x^2", label: "f" }],
      handles: [-3, -1.5, 0, 1.5, 3],
      tolerance: 0.5,
      snap: "half",
      partialCredit: true,
      evaluation,
    },
  },
];

export const exampleFor = (type: string | null): Example =>
  examples.find((example) => example.type === type) ?? examples[0];
