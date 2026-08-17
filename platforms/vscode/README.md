# Bitflow Studio

A visual editor for `.bitflow` files — assessments made of small, reusable
tasks.

## What it does

- Opens any `.bitflow` file as a canvas of steps instead of raw JSON.
- Gives every task type a short labelled form, with validation messages next to
  the field that caused them.
- Previews the assessment exactly as a learner sees it, using the same
  components learners get.
- Keeps the file as the source of truth, so the dirty marker, undo and
  <kbd>Ctrl</kbd>+<kbd>S</kbd> work the way they do everywhere else in VS Code.

## Commands

| Command | What it does |
| --- | --- |
| **Bitflow: New Assessment** | Creates a `.bitflow` file and opens it. |
| **Bitflow: Show Editor** | Opens the current file in the visual editor. |
| **Bitflow: Show Source** | Opens it as JSON. |
| **Bitflow: Preview as a Learner** | Runs the assessment. Nothing is saved. |

## Task types

Choice, yes/no, short answer, fill in the blank and highlighting, plus start,
explanation, text and end screens.

Preview state is deliberately throwaway: previewing an assessment never records
an attempt or writes to the file.
