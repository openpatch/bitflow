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
- Be authorable through a short teacher-facing form with sensible defaults,
  inline validation, live learner preview, and advanced settings hidden until
  needed; raw JSON must not be the only practical authoring path.
- Use the shared, restrained OpenPatch visual language—clear hierarchy,
  readable text, whitespace, rounded surfaces, and purposeful feedback—not
  task-specific game-like decoration or distracting animation.
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

**Suggested type:** `task-drag-drop` — **built**, as
[`@bitflow/task-drag-drop`](packages/bits/task-drag-drop), modelled on
[H5P's Drag and Drop question](https://github.com/h5p/h5p-drag-question).

It follows that model rather than the sketch below: elements sit on the
picture instead of in a tray, regions are invisible and only decide marking,
nothing snaps, and scoring is H5P's (one point per element that belongs
somewhere, penalties for wrong placements, optional single point). The answer
is a position per element rather than a region id, since nothing snaps to a
region. Grading uses bitflow's shared `EvaluationSchema` rather than this
file's `feedbackMode`, so weight, time limits and retry work here without the
task knowing they exist.

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

**Suggested type:** `task-find-hotspots` — **built**, as
[`@bitflow/task-find-hotspots`](packages/bits/task-find-hotspots), modelled on
[H5P's Image Hotspot Question](https://github.com/h5p/h5p-image-hotspot-question).

H5P's model turned out to be simpler than the sketch below and better: one
click, one mark, with several regions allowed to be correct and the wrong ones
carrying their own feedback. There is no required subset, no maximum number of
guesses and no partial credit, because there is only one choice to make. The
answer is the point that was clicked plus the region it hit.

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

## Mouse Accuracy

**Suggested type:** `task-mouse-accuracy` — **built**, as
[`@bitflow/task-mouse-accuracy`](packages/bits/task-mouse-accuracy).

Targets appear one at a time; each round records where the click landed,
whether it hit, and the monotonic elapsed time. The per-round detail also
carries the distance moved, the target's width and Fitts's index of difficulty,
so a lesson can plot time against difficulty. A point per hit, and — if the
author asks for speed too — a second for each hit inside an allowance, kept
apart so accuracy still counts on its own.

The task names the device it needs before it starts. The learner may stand
down, which returns `unknown`: nothing out of nothing, so it neither rewards
them nor drags their total down. There is deliberately no keyboard route to the
targets, since one would measure nothing and would only disguise which question
is being asked.

An answer holds the click position as a fraction of the task's own area, the
hit or miss, and the elapsed milliseconds — no window or screen coordinates, no
pointer type, no device information.

## Keyboard Speed Test

**Suggested type:** `task-keyboard-speed` — **built**, as
[`@bitflow/task-keyboard-speed`](packages/bits/task-keyboard-speed).

A passage, a box, and every character marked as it is passed. Accuracy is
measured against the longer of the two texts, so neither stopping half way nor
typing extra looks perfect; speed is net words per minute at five characters to
a word, so it cannot be gamed by typing nonsense quickly. A mark for accuracy,
and optionally a second for speed — never speed alone.

The text is read from the input's value on change, never from key events, which
is what makes an input method editor work and why there is no key-by-key record
to keep: the component never has one. An answer holds the finished text and one
elapsed figure, rather than start and end timestamps, which is less to keep and
survives a reload.

Timing can be switched off, which leaves accuracy and takes the scoring with
it. The learner can stand down, which returns `unknown` — nothing out of
nothing.

## Ordering / Sequencing

**Suggested type:** `task-ordering` — **built**, as
[`@bitflow/task-ordering`](packages/bits/task-ordering), modelled on
[H5P's Image Sequencing](https://github.com/jithin-space/h5p-ImageSequencing).

Scoring is H5P's — a point per item in its authored place — and the shuffle is
seeded from the attempt so it survives a reload. Widened to text items as well
as pictures.

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

**Suggested type:** `task-matching` — **built**, as
[`@bitflow/task-matching`](packages/bits/task-matching), modelled on
[H5P's Image Pair](https://github.com/jithin-space/h5p-image-pair).

Both sides are written out rather than H5P's optional right side, which quietly
means "match the picture to itself". Text as well as pictures, and the two
columns are shuffled independently from an attempt-seeded shuffle.

Ask learners to match items from two lists, such as terms to definitions,
code fragments to outputs, or images to concepts.

The answer is a list/map of left-item ID to right-item ID pairs. Support
one-to-one and configurable many-to-one matching; provide a keyboard-friendly
pair-selection interface in addition to visual connecting lines.

## Numeric / Expression Answer

**Suggested type:** `task-numeric` — **built**, as
[`@bitflow/task-numeric`](packages/bits/task-numeric).

A number, or a short calculation that comes to one, marked arithmetically
rather than textually: `0.75`, `.75`, `3/4` and `75e-2` are one answer. Five
ways to say how close is close enough — exactly, a fixed amount, a percentage,
decimal places, significant figures — and the authoring form prints the range
the setting actually accepts, because a tolerance is two numbers away from
meaning anything. Where precision decides the mark, the learner is told which
precision; springing it is a trick rather than a question.

The grammar is hand-parsed in about two hundred lines: four operations, powers,
brackets, seventeen named functions, and `pi`, `e` and `tau`. No `eval`, no
`Function`, no `RegExp` over learner text, no request anywhere. Nothing is
blocked so much as unsayable — there is no way to *name* a global, a property
or a call target, so `alert(1)` fails because `alert` is not on the list, not
because it was caught.

A comma is a decimal point by default; a thousands separator never is, in any
mode, since `1,500` cannot mean two things at once. The unit is absent, printed
beside the box, or asked for — and when asked for it can carry its own mark,
because `9.81 m/s` has the arithmetic right and the physics wrong.

The answer is the raw text alone. The value and unit it comes to are derived,
and the reading the score used travels with the *result* rather than the
answer: one stored copy that can disagree with the box after a reload is worse
than deriving it twice. The learner is shown that reading as they type, since
this is the one task type where the thing marked is not the thing typed.

## Maths Expression

**Suggested type:** `task-math` — **built**, as
[`@bitflow/task-math`](packages/bits/task-math), built on
[MathLive](https://mathlive.io) and
[Cortex's Compute Engine](https://cortexjs.io).

Not in the original backlog; added because `task-numeric` answers "what number"
and a great many maths questions ask "what expression". The learner writes it as
maths — fractions as fractions, powers as powers — and it is compared as maths:
`2x`, `x\cdot 2` and `2\times x` are one answer, and no list of spellings was
maintained to make that true.

The author writes a LaTeX template, and what is in it picks the shape. Without a
`\placeholder` it is one editable field and one answer; with them the formula is
printed read-only and the gaps are the answer, each marked where it stands. Both
are one bit because they are one question with a different number of blanks: the
answer is `{ prompts: { name: latex } }` either way, and partial credit falls out
of it. This is distinct from `task-fill-in-the-blank`, which is prose with gaps
matched as text.

Three comparisons, named for the question rather than the algorithm: the same
expression however written (what "factorise it" needs, since a factorised answer
must not match an expanded one), anything mathematically equal to it, or the same
number within a tolerance.

The rules at the top of this file hold. Compute Engine parses LaTeX into MathJSON
and reasons over the structure — a library doing algebra, not a sandbox running
learner input, with no `eval` and no request anywhere. Both it and MathLive are
loaded on demand, so an assessment with one maths question does not put a
megabyte in front of the other twenty, and the KaTeX fonts are inlined as data
URIs rather than left as an asset a consumer has to deploy. Where MathLive cannot
load at all, the learner gets a text box and types LaTeX — the same answer in the
same notation, marked the same way.

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

**Suggested type:** `task-crossword` — **built**, as
[`@bitflow/task-crossword`](packages/bits/task-crossword), modelled on
[H5P's Crossword](https://github.com/otacke/h5p-crossword).

The author writes answers and clues and the grid is laid out from them — but
once, while authoring, and written into the file, rather than in the learner's
browser every time the content is opened. Two learners then get the same
puzzle and the author can see what they are setting. The learner answer is a
map of cell coordinate to letter, and scoring is H5P's: a point per word, or
per letter, with a wrong letter optionally costing one and an empty square
never doing so.

The grid is operated the way a newspaper crossword is — click to type, click
again to turn the corner, arrows to move — and is one tab stop rather than one
per square, so Tab can still leave it. Moving between clues is done from the
clue list, where each clue is also a text field of the right length wired to
the same squares.

## Parsons Puzzle

**Suggested type:** `task-parsons` — **built**, as
[`@bitflow/task-parsons`](packages/bits/task-parsons), scored the way
[js-parsons](https://github.com/js-parsons/js-parsons) scores it.

The learner is given the lines of a program, shuffled, and asks for the
program back: which lines belong, in what order, and — when the author asks
for it — how deeply each is nested. Lines that belong nowhere are part of the
exercise, since deciding what to leave out is most of what reading code is.
The answer is an ordered list of `{ lineId, indent }`, and order and
indentation are scored separately so partial credit means something.

Every move is a drag or a keystroke, and neither is the poor relation: a line
is dragged from the bank into the program, back to the bank to take it out,
and rightwards to nest it — or chosen to add it, moved with up and down,
indented with left and right, and taken out with Backspace. Code is rendered
as text and never executed.

## Find the Words

**Suggested type:** `task-word-search` — **built**, as
[`@bitflow/task-word-search`](packages/bits/task-word-search), modelled on
[H5P's Find the Words](https://github.com/jithin-space/h5p-find-the-words).

The author writes the words and ticks which of the eight runs are allowed; the
grid is generated from them — but once, while authoring, and written into the
file, so two learners get the same puzzle. The filler letters are rolled again
whenever they would spell a hidden word somewhere it was not put, since a
learner who finds the accidental one is right and would be marked wrong.

The answer is a set of drawn runs rather than word ids, and a find is judged on
where it was drawn: that is what lets two words share letters and the same word
be hidden twice. A point per word found, nothing taken away for a drag that
finds nothing. Either way along a word counts.

Drawn with a pointer, which snaps to the eight straight lines, or named with
the keyboard — arrows to move, Enter for the first letter, Enter for the last,
Escape to abandon.

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

### Table Completion

**Suggested type:** `task-table-completion`

Ask learners to fill missing cells in an authored table: program traces, truth
tables, dynamic-programming tables, frequency tables, or conversion tables.

Authors provide fixed rows/columns, cell types, and expected values or a
finite client-side formula for each editable cell. The learner answer is a
cell-ID-to-value map. Evaluate each normalized value locally and support
partial credit per cell.

### Proof Builder

**Suggested type:** `task-proof-builder`

Ask learners to arrange/select valid steps in a mathematical proof, logical
derivation, or algorithm correctness argument.

Authors provide a finite graph of valid proof states/transitions and optional
distractor steps. Evaluate the selected step-ID sequence against that graph in
the browser; do not attempt unrestricted natural-language proof grading.

### Regular Expression

**Suggested type:** `task-regular-expression`

Ask learners to write a regular expression that accepts required strings and
rejects forbidden strings.

Evaluation uses a deliberately restricted, browser-safe regex grammar or a
safe regex engine with bounded execution—not JavaScript `RegExp` over
untrusted patterns without safeguards. Authors provide finite required and
forbidden test strings; the learner answer is the pattern plus enabled flags.

### SQL Result Prediction

**Suggested type:** `task-sql-result`

Show an authored SQL query and database tables, then ask the learner to
predict the output rows/columns or choose from candidate result tables.

Authors provide the expected normalized result table. Evaluate the learner's
submitted table/candidate selection against it in the browser; never execute
learner SQL or require a database server.

### Boolean Circuit Builder

**Suggested type:** `task-circuit-builder`

Ask learners to connect authored input/output nodes and supported Boolean
gates into a circuit.

The learner answer is a graph of stable node/port IDs. Evaluate only an
allow-listed set of gates against a finite author-provided truth-table test
set in the browser; detect cycles and invalid ports before evaluation.

### Network Topology

**Suggested type:** `task-network-topology`

Ask learners to place/connect hosts, switches, routers, or services according
to an authored topology requirement.

The learner answer is a graph of component/port IDs. Evaluate declarative
client-side rules such as required/forbidden edges, maximum degree, reachability,
subnet membership, and redundancy; do not simulate arbitrary network traffic.

### Complexity Classification

**Suggested type:** `task-complexity-classification`

Ask learners to match algorithms or short code snippets to time/space
complexity classes.

Use deterministic matching: authors define snippet IDs, accepted complexity
class IDs, and optional explanation keywords. Do not infer complexity by
executing or statically analyzing arbitrary learner code.

### Bug Finder

**Suggested type:** `task-bug-finder`

Ask learners to select one or more faulty lines in code, a malformed formula,
or incorrect regions in a diagram.

The learner answer is a set of stable line/region IDs. This reuses the
hotspot-selection interaction for diagrams and line-selection for code, but
has distinct evaluation semantics: authors configure required bugs, optional
false-positive penalties, and per-bug feedback.

### Coordinate Transformations

**Suggested type:** `task-coordinate-transform`

Ask learners to translate, rotate, reflect, or scale points/shapes on a
coordinate plane.

Authors define the source geometry and transformation(s); the learner submits
normalized or mathematical coordinates. Evaluate with exact rational/integer
arithmetic where possible and configurable tolerance otherwise. Provide
keyboard coordinate entry.

### Matrix Operations

**Suggested type:** `task-matrix`

Ask learners to calculate an authored matrix operation, determinant, inverse,
or geometric transformation result.

Authors provide finite matrices and an allowed operation; the learner submits
a matrix/cell map. Evaluate using exact integer/rational arithmetic in the
browser, with no server algebra service.

## Suggested Priority

1. ~~Drag and Drop Hotspots~~ — built
2. ~~Find the Hotspots~~ — built
3. ~~Mouse Accuracy~~ — built
4. ~~Keyboard Speed Test~~ — built
5. ~~Ordering / Sequencing~~ — built
6. ~~Matching Pairs~~ — built
7. ~~Parsons Puzzle~~ — built
8. ~~Crossword Puzzle~~ — built
9. ~~Find the Words~~ — built
10. ~~Numeric / Expression Answer~~ — built
10b. ~~Maths Expression~~ — built, as `task-math`
11. Image / Diagram Annotation
12. Short Free-Text With Rubric
13. Code Trace
14. Graph Path and Traversal
15. Number Representation
16. Boolean Logic and Truth Tables
17. Equation Transformation Steps
18. Fractions and Number Lines
19. Table Completion
20. Proof Builder
21. Regular Expression
22. SQL Result Prediction
23. Boolean Circuit Builder
24. Network Topology
25. Complexity Classification
26. Bug Finder
27. Coordinate Transformations
28. Matrix Operations
