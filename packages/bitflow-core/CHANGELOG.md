# @bitflow/core

## 0.7.0

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
