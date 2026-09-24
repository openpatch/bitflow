# @bitflow/web-component

## 0.2.0

### Minor Changes

- [`7d7de7f`](https://github.com/openpatch/bitflow/commit/7d7de7fae99128aebbb8fd398f8a2a2767b9d5cd) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - A dark theme. Every colour token is a `light-dark()` pair, so bitflow follows
  the `color-scheme` of the page around it: set `color-scheme: dark` on a
  container (or `light dark` on the page to follow the OS) and the flow, its
  native controls and its scrollbars go dark. A page that says nothing stays
  light, whatever the OS prefers.

- [`e235646`](https://github.com/openpatch/bitflow/commit/e235646ad679307acf26a0b07fcaf2dc0f438ad2) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Nine new task types, for the questions a school computer science book asks:

  - `task-array-steps` — the array after each step of an algorithm, answered by
    swapping boxes for a sort or typing into them for a stack or a queue.
  - `task-binary-tree` — a binary tree walked in a traversal order, searched, or
    grown by inserting keys; the right answer is worked out from the tree.
  - `task-pixel-grid` — a grid painted from a palette, marked cell by cell; the
    form reads a pasted PBM listing.
  - `task-table` — a table with blanks to fill in, for a predicted query result
    (rows in any order), a value table or a copied spreadsheet formula.
  - `task-point-plot` — points on a plot assigned to classes, for a
    nearest-neighbour prediction or a k-means step.
  - `task-call-stack` — the call stack at moments of a program's run, built by
    pushing and popping frames; the code is never run.
  - `task-cardinality` — an entity-relationship diagram whose relationship ends
    are labelled in Chen, min-max or UML notation.
  - `task-number-line` — values placed on a number line, each marked by how
    close it lands.
  - `task-function-plot` — a graph sketched by setting its value at a few x
    positions, marked against the function the author wrote.

  A Parsons puzzle can also be drawn as a structogram (`display: "structogram"`),
  a Nassi–Shneiderman diagram of the same lines: a line reading "wenn"/"if" is
  drawn as a Verzweigung with its ja/nein triangle, "sonst"/"else" as the start
  of its other case, and any other block as a loop's frame.

  A code trace takes `1,5` for 1.5 where a number is expected, and `wahr` and
  `falsch` for `true` and `false` unless the author made case count.

  All nine can be answered by tapping or typing, so they work the same on a
  phone.

- [`08d3067`](https://github.com/openpatch/bitflow/commit/08d30673cdb2e49d3015c364bd472b3c729ef6a5) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - New theme token `--bitflow-color-on-primary` for text drawn on the primary
  colour (filled buttons, numbered badges), so a host with a light brand colour
  can keep those labels readable. `--bitflow-shadow-outline` now derives from
  `--bitflow-color-primary`.

- [`7d7de7f`](https://github.com/openpatch/bitflow/commit/7d7de7fae99128aebbb8fd398f8a2a2767b9d5cd) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - bitflow no longer asks for Montserrat: `--bitflow-font-family` defaults to
  `inherit`, so a flow is set in the font of the page it sits on. Set the token
  to a font stack to give bitflow its own.

- [`e235646`](https://github.com/openpatch/bitflow/commit/e235646ad679307acf26a0b07fcaf2dc0f438ad2) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - `createShareableReport(doc, attempt, subject)` — an attempt's report with every
  answer taken out, for a page that tells a teacher how a learner is doing
  without telling them what the learner wrote. Exported from the package and from
  `@bitflow/web-component/flow`, together with `parseFlow` and `flowProgress`, so
  a page embedding a flow for a class needs nothing else.

### Patch Changes

- [`08d3067`](https://github.com/openpatch/bitflow/commit/08d30673cdb2e49d3015c364bd472b3c729ef6a5) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - `<bitflow-flow>` fits the box its host gives it instead of clipping whatever
  does not fit — the result page in a fixed-height box lost its bottom half. The
  progress bar stays at the top and the buttons at the bottom, in a compact bar
  under a divider; only the step between them scrolls. With a fixed `height` the
  flow fills it; with only a `max-height` it grows with the step up to the cap;
  with neither it grows with the step. Moving to a new step scrolls back to the
  top, and the step no longer draws a focus ring round itself when it takes
  focus on arrival.

- [`08d3067`](https://github.com/openpatch/bitflow/commit/08d30673cdb2e49d3015c364bd472b3c729ef6a5) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Parsons puzzles wrap long lines of code inside their block, with continuations
  hanging one step in, and an indented line no longer sticks out past its column
  by its own indentation.

- [`171964b`](https://github.com/openpatch/bitflow/commit/171964b214156a554baaeb83615b80f6d8288906) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Tasks work on a phone.

  - Ordering and Parsons lines are dragged by a grip with a finger, so a swipe
    anywhere else on a line scrolls the step instead of being swallowed, and a
    Parsons line can now be reordered and indented on a touch screen at all. A
    drag held near the edge of the step or the page scrolls it. On a touch
    screen every placed Parsons line also has buttons to move it up and down and
    to indent and outdent it.
  - An image annotation with point marks no longer traps a swipe that starts on
    the picture.
  - The graph in a graph-path task keeps readable labels and tappable places on
    a narrow screen instead of shrinking with it.
  - A numeric answer gets a ± key on touch screens, where the iPhone's decimal
    keypad has no minus; a hexadecimal answer gets a keyboard with letters; code,
    short answers and blanks are no longer capitalised or autocorrected.
  - A long blank stays inside the screen, and the crossword's word boxes no
    longer make iOS zoom the page.
  - Drag-and-drop labels scale with the picture and have a larger target on touch
    screens; highlighting spaces its words out for a finger; matching keeps the
    held card in view while the learner scrolls to its partner.
  - Keyboard-speed and mouse-accuracy tell a touch-screen learner that their
    result will not be comparable. Nothing about the device is recorded.
  - A host can reserve room at the end of the navigation bar for its own button
    with `--bitflow-controls-inset-end`, and a printed flow shows the whole step
    rather than the part scrolled into view.

## 0.1.0

### Minor Changes

- [`b04f2a8`](https://github.com/openpatch/bitflow/commit/b04f2a85afcc8cba23c092bd0636b81acddf6416) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Rewrite bitflow as web components.

  bitflow is now a set of custom elements — `<bitflow-flow>`,
  `<bitflow-flow-editor>`, `<bitflow-report>`, `<bitflow-group-report>`, and one
  per task type — usable from any framework or from plain HTML. React remains the
  implementation behind them.

  Two packages ship, not thirty-six. `@bitflow/web-component` carries the elements
  and every task type inside it, each still its own lazily loaded chunk, so a flow
  downloads only the tasks it references — and a page needs one
  `<script type="module">` and nothing else: there is no React to install and no
  dependency of any kind. `@bitflow/core` stays separate because it is the half
  that runs in Node — the schema, the flow engine and the scoring, for a server or
  a CLI that reads a `.bitflow` file without drawing it.

  The per-task packages are no longer published on their own. `@bitflow/task-choice`,
  `@bitflow/task-yes-no`, `@bitflow/task-input`, `@bitflow/task-fill-in-the-blank`,
  `@bitflow/task-highlighting`, `@bitflow/input-markdown`, `@bitflow/start-simple`
  and `@bitflow/end-tries` stop at 0.x; their code, and that of every task type
  added since, arrives inside `@bitflow/web-component`. They are still one
  directory per task in the repository — the split is how the code is written, not
  how it is shipped.

  The `.bitflow` format is redesigned and not backward compatible: branching lives
  on edges as conditions rather than in dedicated control-flow nodes, and each
  task type owns the schema for its own data. Evaluation, scoring and cohort
  statistics all run in the browser; nothing here talks to a server.

  `@openpatch/patches`, `@emotion/*` and `@vocab/*` are gone, replaced by plain
  CSS custom properties and runtime JSON message catalogs. The competency
  modelling packages are dropped.

  There is also a VS Code extension, Bitflow Studio, for authoring `.bitflow`
  files visually.

  Tasks can carry a weight and a time limit, the assessment as a whole can carry
  one too, and arriving at a step moves focus to it and announces it.

  Item pools hand each learner a random few of a group of interchangeable
  steps, the editor can arrange the canvas and preview from any step, and the
  cohort report exports CSV.

  Four more task types: `@bitflow/task-drag-drop` drags labels onto a picture,
  `@bitflow/task-find-hotspots` asks the learner to click a place on one, `@bitflow/task-ordering` asks them to put items in order, and
  `@bitflow/task-matching` asks them to pair two columns off.

  A branch can read more of the run than it could: how sure the learner said they
  were, how many times a step has been shown, the clock, and counts scoped to a
  section, a hand-picked set of steps, or the last few answered. A connection can
  clear the step it lands on, which is what makes "get it wrong, read why, try
  again" a loop that actually hands the question back rather than the old answer
  already marked.

  Sections group steps that share a passage, a listing or a table, and show it
  above every one of them. A pool can shuffle, so the same questions arrive in a
  different order for every learner. An assessment says how freely learners may
  move — forwards only, a step back, or a list of everything they have seen that
  doubles as the check-your-work screen — and whether a task may be passed on,
  which a single task can override.

  Five more non-task steps: `@bitflow/start-consent` says what is recorded and
  will not start until the learner has answered either way,
  `@bitflow/start-identify` asks who they are, `@bitflow/end-handoff` posts the
  finished attempt to the page hosting the assessment,
  `@bitflow/end-certificate` is a printable closing sheet, and
  `@bitflow/end-download` hands the learner their own attempt as a file.

  `<Flow>` and `<bitflow-flow>` gain a `lockedNodeIds` prop: steps a host is
  holding shut. The learner may answer the step they are on but not move on from
  it, and may not skip past it — a gate that can be walked around is not a gate.
  Looking back at what they have already done stays open to them. It
  is host-supplied, in exactly the same shape as the existing `readonly`: the
  runtime has no idea where the list comes from and never asks. A node report
  whose `answer` has been stripped is now a valid report, so a live session can
  send the host results, scores, tries and timings without ever sending what
  anyone wrote.

  There is also a live-session platform, `platforms/party`, for running a flow with
  a class: a host points a session at a flow URL, shares a code, and watches a
  live board while locking steps. The packages stay transport-free — the socket
  lives entirely in `platforms/` — and the server stores results, never the
  document, and never an answer. It is private and is not published.
