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
];

export const exampleFor = (type: string | null): Example =>
  examples.find((example) => example.type === type) ?? examples[0];
