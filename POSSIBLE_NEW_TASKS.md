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

## Suggested Priority

1. Drag and Drop Hotspots
2. Ordering / Sequencing
3. Matching Pairs
4. Parsons Puzzle
5. Crossword Puzzle
6. Find the Words
7. Numeric / Expression Answer
8. Image / Diagram Annotation
9. Short Free-Text With Rubric
