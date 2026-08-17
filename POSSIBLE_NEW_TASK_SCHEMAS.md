# Draft Schemas for Possible New Tasks

These are **proposed `data` shapes** for the task types in
[`POSSIBLE_NEW_TASKS.md`](POSSIBLE_NEW_TASKS.md). They are intentionally JSON
examples instead of final generated JSON Schema documents: the implementation
agent should turn each into a strict zod schema and export its JSON Schema.

Every task must also include the common Bitflow node envelope (`id`, `type`,
and `position`). These objects are the task-specific `node.data` only.

## Shared Rules

- Each data object has `schemaVersion: 1`.
- All IDs are stable, unique strings; learner answers only refer to IDs.
- Image coordinates are normalized fractions in the inclusive range `0..1`.
- Expected answers and evaluation settings are authored data and are available
  locally to the browser; no evaluation endpoint exists.
- An implementation must reject unknown enum values, duplicate IDs, invalid
  references, malformed geometry, and authored data that cannot be evaluated
  deterministically.

## Drag and Drop Hotspots — `task-drag-drop`

```json
{
  "schemaVersion": 1,
  "prompt": "Label the parts of the CPU.",
  "background": {
    "src": "/images/cpu.png",
    "alt": "CPU diagram with processor parts"
  },
  "items": [
    { "id": "alu", "kind": "text", "label": "ALU" },
    { "id": "registers", "kind": "text", "label": "Registers" }
  ],
  "zones": [
    {
      "id": "alu-zone",
      "label": "Arithmetic logic unit",
      "rect": { "x": 0.18, "y": 0.34, "width": 0.2, "height": 0.12 },
      "acceptedItemIds": ["alu"],
      "score": 1
    }
  ],
  "evaluation": {
    "allowMultiplePlacements": false,
    "requireAllItems": true,
    "feedbackMode": "onSubmit"
  }
}
```

Learner answer: `{ "placements": [{ "itemId": "alu", "zoneId": "alu-zone" }] }`.

## Find the Hotspots — `task-find-hotspots`

```json
{
  "schemaVersion": 1,
  "prompt": "Find all input devices.",
  "background": {
    "src": "/images/workstation.png",
    "alt": "A workstation containing monitor, keyboard, mouse, and printer"
  },
  "hotspots": [
    {
      "id": "keyboard",
      "label": "Keyboard",
      "shape": { "kind": "rect", "x": 0.27, "y": 0.69, "width": 0.31, "height": 0.1 },
      "score": 1
    },
    {
      "id": "mouse",
      "label": "Mouse",
      "shape": { "kind": "circle", "x": 0.65, "y": 0.72, "radius": 0.04 },
      "score": 1
    }
  ],
  "evaluation": {
    "requiredHotspotIds": ["keyboard", "mouse"],
    "maximumGuesses": 4,
    "retainIncorrectGuesses": true,
    "feedbackMode": "onSubmit"
  }
}
```

Learner answer: `{ "selections": [{ "x": 0.31, "y": 0.73, "matchedHotspotId": "keyboard" }] }`.

## Mouse Accuracy — `task-mouse-accuracy`

```json
{
  "schemaVersion": 1,
  "prompt": "Click each target as accurately as you can.",
  "targets": [
    { "id": "target-1", "x": 0.2, "y": 0.3, "radius": 0.04 },
    { "id": "target-2", "x": 0.8, "y": 0.7, "radius": 0.02 }
  ],
  "rounds": { "targetOrder": "fixed", "maximumAttemptsPerTarget": 1 },
  "evaluation": {
    "score": { "hits": 1, "misses": 0, "includeElapsedTime": true },
    "timeLimitMs": 30000,
    "allowNotApplicable": true
  },
  "alternativeTaskId": "keyboard-navigation-alternative"
}
```

Learner answer:

```json
{
  "status": "completed",
  "rounds": [
    { "targetId": "target-1", "x": 0.2, "y": 0.3, "hit": true, "elapsedMs": 812 }
  ],
  "totalElapsedMs": 812
}
```

`status` is `"completed"` or `"notApplicable"`. Do not store raw pointer
events, device type, browser data, or high-frequency movement traces.

## Keyboard Speed Test — `task-keyboard-speed`

```json
{
  "schemaVersion": 1,
  "prompt": "Type the text exactly as shown.",
  "text": "The quick brown fox jumps over the lazy dog.",
  "input": { "multiline": false, "normalizeWhitespace": true },
  "evaluation": {
    "timeLimitMs": 60000,
    "minimumAccuracyPercent": 95,
    "metrics": ["correctCharacters", "accuracyPercent", "charactersPerMinute", "wordsPerMinute"],
    "allowNotApplicable": true
  },
  "alternativeTaskId": "text-comprehension-alternative"
}
```

Learner answer:

```json
{
  "status": "completed",
  "text": "The quick brown fox jumps over the lazy dog.",
  "startedAtMonotonicMs": 1200,
  "finishedAtMonotonicMs": 8300
}
```

Derive speed and accuracy from final text plus timestamps in the browser. Do
not store individual key events or keys typed outside the task input.

## Ordering / Sequencing — `task-ordering`

```json
{
  "schemaVersion": 1,
  "prompt": "Put the steps in order.",
  "items": [
    { "id": "design", "label": "Design the solution", "targetIndex": 0, "targetIndentation": 0 },
    { "id": "implement", "label": "Implement it", "targetIndex": 1, "targetIndentation": 0 },
    { "id": "test", "label": "Write unit tests", "targetIndex": 2, "targetIndentation": 1 }
  ],
  "evaluation": {
    "enableIndentation": true,
    "maximumIndentation": 2,
    "scoreOrder": 2,
    "scoreIndentation": 1,
    "feedbackMode": "onSubmit"
  }
}
```

Learner answer: `{ "items": [{ "itemId": "design", "indentation": 0 }] }`.

## Matching Pairs — `task-matching`

```json
{
  "schemaVersion": 1,
  "prompt": "Match each term to its definition.",
  "leftItems": [
    { "id": "stack", "label": "Stack" },
    { "id": "queue", "label": "Queue" }
  ],
  "rightItems": [
    { "id": "lifo", "label": "Last in, first out" },
    { "id": "fifo", "label": "First in, first out" }
  ],
  "acceptedPairs": [
    { "leftId": "stack", "rightId": "lifo" },
    { "leftId": "queue", "rightId": "fifo" }
  ],
  "evaluation": {
    "matchingMode": "oneToOne",
    "feedbackMode": "onSubmit"
  }
}
```

Learner answer: `{ "pairs": [{ "leftId": "stack", "rightId": "lifo" }] }`.

## Numeric / Expression Answer — `task-numeric`

```json
{
  "schemaVersion": 1,
  "prompt": "Convert 2.5 seconds to milliseconds.",
  "acceptedAnswers": [
    { "value": 2500, "unit": "ms" },
    { "value": 2500, "unit": "milliseconds" }
  ],
  "input": {
    "allowExpression": false,
    "allowDecimalComma": true,
    "unitLabel": "ms"
  },
  "evaluation": {
    "absoluteTolerance": 0,
    "relativeTolerance": 0,
    "requiredSignificantFigures": null
  }
}
```

Learner answer: `{ "raw": "2500", "normalizedValue": 2500, "unit": "ms" }`.

## Image / Diagram Annotation — `task-image-annotation`

```json
{
  "schemaVersion": 1,
  "prompt": "Mark the center of the circle.",
  "background": { "src": "/images/circle.png", "alt": "A circle on a coordinate plane" },
  "annotation": {
    "kind": "point",
    "maximumCount": 1,
    "requireLabel": false
  },
  "acceptedRegions": [
    { "id": "center", "kind": "circle", "x": 0.5, "y": 0.5, "radius": 0.03 }
  ],
  "evaluation": { "requiredRegionIds": ["center"], "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "annotations": [{ "kind": "point", "x": 0.49, "y": 0.51, "label": null }] }`.

## Short Free Text With Rubric — `task-free-text`

```json
{
  "schemaVersion": 1,
  "prompt": "Explain why binary search requires a sorted list.",
  "input": { "minimumLength": 20, "maximumLength": 1000 },
  "rubric": [
    { "id": "sorted", "label": "Mentions sorted order", "keywords": ["sorted", "order"], "score": 1 },
    { "id": "halve", "label": "Mentions halving the search range", "keywords": ["half", "middle"], "score": 1 }
  ],
  "evaluation": { "mode": "keyword", "caseSensitive": false, "feedbackMode": "manual" }
}
```

Learner answer: `{ "text": "Binary search compares the middle value in a sorted list." }`.

## Crossword Puzzle — `task-crossword`

```json
{
  "schemaVersion": 1,
  "prompt": "Complete the computer science crossword.",
  "grid": { "rows": 5, "columns": 5, "blockedCells": ["0:4", "1:4"] },
  "clues": [
    {
      "id": "queue",
      "number": 1,
      "direction": "across",
      "start": { "row": 0, "column": 0 },
      "answer": "QUEUE",
      "clue": "A first-in, first-out data structure"
    }
  ],
  "evaluation": { "feedbackMode": "onSubmit", "scorePerClue": 1 }
}
```

Learner answer: `{ "cells": { "0:0": "Q", "0:1": "U" } }`.

## Parsons Puzzle — `task-parsons-puzzle`

```json
{
  "schemaVersion": 1,
  "prompt": "Arrange the lines to calculate a sum.",
  "language": "python",
  "lines": [
    { "id": "total", "text": "total = 0", "targetIndex": 0, "targetIndentation": 0 },
    { "id": "loop", "text": "for value in values:", "targetIndex": 1, "targetIndentation": 0 },
    { "id": "add", "text": "total += value", "targetIndex": 2, "targetIndentation": 1 },
    { "id": "distractor", "text": "print(values)", "distractor": true }
  ],
  "evaluation": { "scoreOrder": 2, "scoreIndentation": 1, "penalizeDistractors": false }
}
```

Learner answer: `{ "lines": [{ "lineId": "total", "indentation": 0 }] }`.

## Find the Words — `task-word-search`

```json
{
  "schemaVersion": 1,
  "prompt": "Find the data structure words.",
  "grid": ["STACK", "QUEUE", "TREES", "GRAPH", "ARRAY"],
  "words": [
    {
      "id": "stack",
      "label": "STACK",
      "path": [{ "row": 0, "column": 0 }, { "row": 0, "column": 1 }, { "row": 0, "column": 2 }, { "row": 0, "column": 3 }, { "row": 0, "column": 4 }]
    }
  ],
  "evaluation": { "allowDiagonal": true, "allowBackward": true, "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "foundWordIds": ["stack"] }`.

## Code Trace — `task-code-trace`

```json
{
  "schemaVersion": 1,
  "prompt": "What is the value of total after the loop?",
  "language": "javascript",
  "code": "let total = 0;\nfor (const value of [1, 2, 3]) total += value;",
  "checkpoints": [
    {
      "id": "after-loop",
      "label": "Value of total after the loop",
      "expected": { "total": "6" },
      "inputMode": "values"
    }
  ],
  "evaluation": { "feedbackMode": "onSubmit", "scorePerCheckpoint": 1 }
}
```

Learner answer: `{ "checkpointAnswers": { "after-loop": { "total": "6" } } }`.

## Algorithm Simulation — `task-algorithm-simulation`

```json
{
  "schemaVersion": 1,
  "prompt": "Perform the next selection-sort swap.",
  "algorithm": "selectionSort",
  "initialState": { "values": [3, 1, 2], "index": 0 },
  "validTransitions": [
    {
      "id": "swap-0-1",
      "from": { "values": [3, 1, 2], "index": 0 },
      "to": { "values": [1, 3, 2], "index": 1 },
      "score": 1
    }
  ],
  "evaluation": { "mode": "transitionGraph", "feedbackMode": "afterEachStep" }
}
```

Learner answer: `{ "transitionIds": ["swap-0-1"] }`.

## Graph Path and Traversal — `task-graph-path`

```json
{
  "schemaVersion": 1,
  "prompt": "Find the shortest path from A to D.",
  "graph": {
    "directed": false,
    "nodes": [{ "id": "a", "label": "A" }, { "id": "d", "label": "D" }],
    "edges": [{ "id": "a-d", "source": "a", "target": "d", "weight": 3 }]
  },
  "goal": { "kind": "shortestPath", "sourceId": "a", "targetId": "d" },
  "evaluation": { "acceptEqualCostAlternatives": true, "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "nodeIds": ["a", "d"], "edgeIds": ["a-d"] }`.

## Number Representation — `task-number-representation`

```json
{
  "schemaVersion": 1,
  "prompt": "Write decimal 42 in 8-bit binary.",
  "source": { "value": "42", "representation": "decimal" },
  "target": { "representation": "binary", "bitWidth": 8, "signed": false },
  "input": { "allowPrefix": true, "allowSeparators": true },
  "evaluation": { "acceptedValues": ["00101010"], "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "raw": "00101010", "normalized": "00101010" }`.

## Boolean Logic and Truth Tables — `task-boolean-logic`

```json
{
  "schemaVersion": 1,
  "prompt": "Complete the output column for A AND NOT B.",
  "variables": ["A", "B"],
  "expression": {
    "kind": "and",
    "left": { "kind": "variable", "name": "A" },
    "right": { "kind": "not", "value": { "kind": "variable", "name": "B" } }
  },
  "rows": [
    { "id": "00", "inputs": { "A": false, "B": false } },
    { "id": "10", "inputs": { "A": true, "B": false } }
  ],
  "evaluation": { "feedbackMode": "onSubmit", "scorePerRow": 1 }
}
```

Learner answer: `{ "outputs": { "00": false, "10": true } }`.

## Finite Automata — `task-finite-automaton`

```json
{
  "schemaVersion": 1,
  "prompt": "Does this DFA accept 101?",
  "automaton": {
    "kind": "dfa",
    "alphabet": ["0", "1"],
    "initialStateId": "even",
    "acceptingStateIds": ["even"],
    "states": [{ "id": "even", "label": "Even" }, { "id": "odd", "label": "Odd" }],
    "transitions": [
      { "fromId": "even", "symbol": "1", "toId": "odd" },
      { "fromId": "odd", "symbol": "1", "toId": "even" }
    ]
  },
  "inputWord": "101",
  "goal": { "kind": "acceptance" },
  "evaluation": { "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "accepted": true }`.

## Equation Transformation Steps — `task-equation-steps`

```json
{
  "schemaVersion": 1,
  "prompt": "Solve 2x + 4 = 10.",
  "initialExpression": "2*x + 4 = 10",
  "grammar": "linearEquationV1",
  "acceptedSteps": [
    { "id": "subtract-four", "expression": "2*x = 6", "score": 1 },
    { "id": "divide-two", "expression": "x = 3", "score": 1 }
  ],
  "evaluation": { "requireOrder": true, "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "expressions": ["2*x = 6", "x = 3"] }`.

## Function Plot and Point Placement — `task-function-plot`

```json
{
  "schemaVersion": 1,
  "prompt": "Plot the intercepts of y = x - 2.",
  "viewport": { "xMin": -5, "xMax": 5, "yMin": -5, "yMax": 5 },
  "function": { "kind": "linear", "slope": 1, "intercept": -2 },
  "goal": {
    "kind": "points",
    "expectedPoints": [{ "x": 0, "y": -2 }, { "x": 2, "y": 0 }]
  },
  "evaluation": { "tolerance": 0.1, "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "points": [{ "x": 0, "y": -2 }, { "x": 2, "y": 0 }] }`.

## Fractions and Number Lines — `task-fractions`

```json
{
  "schemaVersion": 1,
  "prompt": "Simplify 12/18.",
  "goal": { "kind": "simplifyFraction", "numerator": 12, "denominator": 18 },
  "evaluation": { "acceptedFractions": [{ "numerator": 2, "denominator": 3 }], "feedbackMode": "onSubmit" }
}
```

Learner answer: `{ "numerator": 2, "denominator": 3 }`.

## Sets, Relations, and Venn Diagrams — `task-sets`

```json
{
  "schemaVersion": 1,
  "prompt": "Place each number in the correct Venn region.",
  "sets": [
    { "id": "even", "label": "Even numbers" },
    { "id": "multiple-of-three", "label": "Multiples of three" }
  ],
  "elements": [
    { "id": "six", "label": "6", "expectedSetIds": ["even", "multiple-of-three"] },
    { "id": "four", "label": "4", "expectedSetIds": ["even"] }
  ],
  "evaluation": { "feedbackMode": "onSubmit", "scorePerElement": 1 }
}
```

Learner answer: `{ "membership": { "six": ["even", "multiple-of-three"], "four": ["even"] } }`.

## Suggested Priority

Use the ordering in [`POSSIBLE_NEW_TASKS.md`](POSSIBLE_NEW_TASKS.md). Schemas
should be implemented only when their task type is selected for development.
