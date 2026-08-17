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

The answer is an ordered array of stable item IDs. Provide drag-and-drop
reordering plus keyboard move-up/move-down controls. Support exact-order and
partial-credit scoring.

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

## Suggested Priority

1. Drag and Drop Hotspots
2. Ordering / Sequencing
3. Matching Pairs
4. Numeric / Expression Answer
5. Image / Diagram Annotation
6. Short Free-Text With Rubric
