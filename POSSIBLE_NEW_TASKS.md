# Possible New Task Types

This is a product backlog for task types that may be added after the web
component rewrite in `PLAN.md`. Each task should follow the same rules as the
initial nine bits:

- Ship as an independently importable and usable web component.
- Own its zod `data` schema and self-register in the bit registry.
- Be lazy-loadable by `<bitflow-flow>`.
- Emit a serializable answer/result that can be included in an assessment
  attempt snapshot and report.
- Be keyboard-accessible and have an equivalent non-pointer interaction.
- **Evaluate entirely in the browser.** A task must be able to determine its
  result from its authored configuration and learner answer without any
  network request, remote service, server-side code execution, or hidden
  answer API. Server-hosted systems may collect the resulting raw report
  data, but must not be required to grade the task.

## Browser-Only Evaluation Rules

All future task types must retain deterministic, client-only evaluation:

- Store expected answers, accepted alternatives, scoring policy, and test
  fixtures in the authored `.bitflow` task data (or in a static bit package),
  never behind an evaluation endpoint.
- Code tasks must not execute untrusted learner code with `eval`,
  `Function`, a remote runner, or a server sandbox. Use a constrained,
  task-specific interpreter, a finite state machine, parser/token comparison,
  or author-provided expected traces/test results instead.
- Any randomness used to generate a task must be seeded and persist the seed
  in the attempt snapshot so an attempt can be restored and independently
  re-evaluated in the browser.
- The component's result must be reproducible from the `.bitflow` schema
  version, bit version, authored task data, and serialized learner answer.

## Drag and Drop Hotspots

**Suggested type:** `task-drag-drop`

Allow learners to drag text labels, images, or both into invisible drop zones
over a background image. Typical uses include labeling diagrams, placing
elements on a map, and assembling an annotated process.

The author configures:

- One background image, including descriptive alternative text.
- Draggable items: text and/or images, stable IDs, labels/alternative text.
- Drop zones: stable IDs, positions/sizes relative to the image (`0..1`
  normalized coordinates, never fixed pixels), optional visible authoring
  overlay, and accepted item IDs.
- Evaluation policy: exact placement, accepted-item sets, optional per-zone
  score, and whether an item may be placed in more than one zone.

The learner answer is a JSON map of item IDs to zone IDs, not pixel
coordinates. This keeps evaluation deterministic and responsive across screen
sizes. Persist that map through the standard attempt-state events.

Accessibility requirements:

- Provide a keyboard alternative: select an item, then select a destination
  zone from a labelled list/combobox.
- Announce placement, removal, and evaluation feedback using live regions.
- Do not make the image the sole source of meaning; require text labels or an
  author-supplied textual description for zones/items.
- Support pointer, touch, and keyboard interaction without requiring native
  HTML drag events alone.

## Find the Hotspots

**Suggested type:** `task-find-hotspots`

Show an image with one or more invisible target regions that the learner must
identify by clicking/tapping them. Typical uses include finding components in
a diagram, identifying errors in a screenshot, or locating features on a map.
This is distinct from `task-drag-drop`: there are no supplied items to place,
only regions for the learner to discover.

The author configures:

- One background image with descriptive alternative text.
- Target regions with stable IDs and normalized coordinates (`0..1`),
  represented as rectangles, circles, or polygons.
- Optional prompt/instructions, required number of targets, maximum guesses,
  and whether incorrect guesses are shown or retained.
- Evaluation policy: all targets required, a required subset, or a target
  score; optional partial credit and per-region feedback.

The learner answer is an ordered list of normalized clicks/selections:
`{ x, y, matchedHotspotId?: string }[]`. Preserve both the raw selection and
matched target ID for deterministic evaluation, reporting, and review.

Accessibility requirements:

- Do not make visual searching the only path: provide a keyboard-accessible
  list of labelled candidate regions or coordinates, with equivalent scoring.
- Announce successful, duplicate, and incorrect selections using live
  regions; do not rely on color alone.
- Require sufficient author-provided textual context for the image and
  hotspot targets.

## Ordering / Sequencing

**Suggested type:** `task-ordering`

Present items in a shuffled list and ask the learner to put them in the
correct order. Useful for algorithms, historical timelines, workflow steps,
and scientific processes.

Authors may optionally enable indentation, configure the target indentation
level for each item, and set a maximum nesting depth. This supports outlining
processes, nested concepts, and structured pseudocode without requiring a
code-specific Parsons puzzle.

The answer is an ordered array of `{ itemId, indentation? }` entries. Provide
drag-and-drop reordering/indenting plus keyboard move-up/move-down and
indent/outdent controls. Support exact-order, indentation, and partial-credit
scoring independently.

## Matching Pairs

**Suggested type:** `task-matching`

Ask learners to match items from two lists, such as terms to definitions,
code fragments to outputs, or images to concepts.

The answer is a list/map of left-item ID to right-item ID pairs. Support
one-to-one and configurable many-to-one matching; provide a keyboard-friendly
pair-selection interface in addition to visual connecting lines.

## Numeric / Expression Answer

**Suggested type:** `task-numeric`

Accept a numeric value or a small mathematical expression, with configurable
units, decimal separators, acceptable tolerance, and significant figures.

Evaluation must avoid `eval`; parse only a deliberately small, documented
expression grammar. Store the raw learner input alongside the normalized
numeric result for reporting and review.

## Image / Diagram Annotation

**Suggested type:** `task-image-annotation`

Let a learner place point, rectangle, or freehand annotations on an image and
optionally attach a short label. Unlike drag-and-drop hotspots, this evaluates
the learner's chosen position/region rather than assignment of supplied items
to supplied zones.

Persist normalized coordinates and labels. Authors define acceptable regions
and a distance/overlap threshold for automatic evaluation. Provide a
text-based alternative for any task where the image is not merely decorative.

## Short Free-Text With Rubric

**Suggested type:** `task-free-text`

Collect a multi-line learner response and evaluate it against an author
configured rubric/checklist. Initial evaluation can be manual, keyword based,
or mark the result `unknown`; it must not imply that subjective free text is
automatically graded correctly.

Store the full text answer and rubric outcomes in the raw attempt report so
an external reviewer or reporting component can display it.

## Crossword Puzzle

**Suggested type:** `task-crossword`

Present a crossword grid with across/down clues. Authors provide a fixed grid
shape, numbered clue list, and answers; the component derives intersections
from the grid and validates that every answer fits before publishing.

The learner answer is a map of cell coordinate to entered letter, optionally
including which clues have been checked. Evaluate each clue and the completed
grid; support immediate-feedback and submit-only modes without exposing
answers before the configured evaluation point.

The grid must be fully keyboard operable: arrow keys move between cells,
Tab moves between clues, and the current clue is announced. Provide a
clue-list input alternative for screen readers and small screens.

## Parsons Puzzle

**Suggested type:** `task-parsons-puzzle`

Ask the learner to arrange shuffled code lines into the correct order, with
optional indentation. This is a specialized, code-aware form of ordering for
programming assessments.

Authors configure code lines with stable IDs, the target order, indentation
level, language for syntax highlighting, and optional distractor lines. The
learner answer is an ordered list of `{ lineId, indentation }` entries.

Evaluate line order and indentation separately to support partial credit and
specific feedback. Provide drag-and-drop, keyboard move controls, and an
accessible text/list representation; never require the learner to drag with
a pointer. Render code as text, never execute it.

## Find the Words

**Suggested type:** `task-word-search`

Present a word-search grid where learners find configured words horizontally,
vertically, diagonally, and optionally backwards. Authors provide the letter
grid, target words, and the exact normalized cell paths for each word.

The learner answer is a set of selected cell paths/word IDs. The component
evaluates paths rather than relying only on the displayed letters, which
allows duplicate words and deterministic reporting.

Support pointer/touch selection plus a keyboard alternative: choose a target
word, then enter/select its start and end cells (or choose its cell path from
a grid navigation mode). Announce found words and remaining targets without
using color as the only feedback.

## Computer Science Tasks

### Code Trace

**Suggested type:** `task-code-trace`

Show a small, author-provided program and ask the learner to predict variable
values, output, or the next execution step at configured checkpoints.

Authors provide the code as display text plus a finite sequence of expected
execution states. The learner selects/fills values for each checkpoint. The
task evaluates by comparing against those authored states; it never executes
the displayed code.

### Algorithm Simulation

**Suggested type:** `task-algorithm-simulation`

Ask the learner to perform the next step of a known algorithm, such as
selection sort, insertion sort, BFS, DFS, Dijkstra, or binary search.

Authors provide a finite state graph of valid algorithm states and transitions
(or an initial state plus a small, built-in deterministic simulation for that
specific algorithm). The learner answer selects an allowed transition. This
keeps evaluation entirely in-browser and allows partial credit for reaching
correct intermediate states.

### Graph Path and Traversal

**Suggested type:** `task-graph-path`

Present a weighted or unweighted graph and ask the learner to select a path,
shortest path, traversal order, spanning tree, or cut.

The learner answer is a stable node/edge ID sequence. Evaluate with
client-side graph algorithms over the authored graph—BFS/DFS, Dijkstra,
Kruskal/Prim, and direct path validation are deterministic and require no
server.

### Number Representation

**Suggested type:** `task-number-representation`

Ask learners to convert among binary, decimal, hexadecimal, two's complement,
ASCII/Unicode, bit masks, and fixed-width integer representations.

Store the source value, target representation, bit width, and accepted
formatting variants in task data. Evaluate by parsing a deliberately limited
input grammar and comparing normalized values in the browser.

### Boolean Logic and Truth Tables

**Suggested type:** `task-boolean-logic`

Ask learners to complete a truth table, evaluate a Boolean expression, match a
logic circuit to its output, or identify an equivalent expression.

Authors provide variables and an expression/circuit in a small safe Boolean
AST—never JavaScript source. Evaluate the AST for every input row in the
browser and compare the learner's selected values.

### Finite Automata

**Suggested type:** `task-finite-automaton`

Ask learners to simulate a DFA/NFA on an input word, choose transitions, or
construct a transition table from a supplied state set and alphabet.

Evaluate with a compact in-browser automaton interpreter over author-provided
states/transitions. The learner answer is a transition sequence, set of active
states, or transition table map; no general-purpose code execution is needed.

## Mathematics Tasks

### Equation Transformation Steps

**Suggested type:** `task-equation-steps`

Ask learners to solve an equation by selecting or entering valid intermediate
transformation steps, such as adding the same value to both sides or factoring
an expression.

Start with linear equations and a deliberately limited symbolic expression
grammar. Authors provide expected states or valid state transitions; evaluate
equivalence in the browser using canonical forms for the supported grammar.
Do not claim general-purpose computer algebra support unless it is actually
implemented and fully browser-compatible.

### Function Plot and Point Placement

**Suggested type:** `task-function-plot`

Ask learners to plot a function, place points, identify intercepts, or match a
formula to a graph.

Use normalized graph coordinates in answers. Authors provide a finite set of
expected points/regions or a supported mathematical function AST; evaluate
with client-side numeric sampling and configurable tolerance. Provide keyboard
coordinate entry as an alternative to pointer placement.

### Fractions and Number Lines

**Suggested type:** `task-fractions`

Ask learners to simplify a fraction, find equivalent fractions, place values
on a number line, or compare rational numbers.

Parse numerator/denominator input as integers and reduce using browser-side
integer arithmetic. Number-line positions are normalized coordinates with
author-configured tolerance; no floating-point-only equality checks.

### Sets, Relations, and Venn Diagrams

**Suggested type:** `task-sets`

Ask learners to construct a set, classify elements into Venn-diagram regions,
or determine whether a relation is a function/equivalence relation.

Answers are stable element-to-region/set maps. Evaluate membership, union,
intersection, complement, and relation properties against finite
author-provided sets entirely in the browser. Provide list/select controls in
addition to a visual Venn diagram.

## Suggested Priority

1. Drag and Drop Hotspots
2. Find the Hotspots
3. Ordering / Sequencing
4. Matching Pairs
5. Parsons Puzzle
6. Crossword Puzzle
7. Find the Words
8. Numeric / Expression Answer
9. Image / Diagram Annotation
10. Short Free-Text With Rubric
11. Code Trace
12. Graph Path and Traversal
13. Number Representation
14. Boolean Logic and Truth Tables
15. Equation Transformation Steps
16. Fractions and Number Lines
