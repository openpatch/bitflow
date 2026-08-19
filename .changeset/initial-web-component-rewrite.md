---
"@bitflow/core": major
"@bitflow/element": major
"@bitflow/bitflow": major
"@bitflow/report": major
"@bitflow/web-component": major
"@bitflow/start-simple": major
"@bitflow/title-simple": major
"@bitflow/input-markdown": major
"@bitflow/end-tries": major
"@bitflow/task-choice": major
"@bitflow/task-yes-no": major
"@bitflow/task-input": major
"@bitflow/task-numeric": major
"@bitflow/task-math": major
"@bitflow/task-fill-in-the-blank": major
"@bitflow/task-highlighting": major
"@bitflow/task-drag-drop": major
"@bitflow/task-find-hotspots": major
"@bitflow/task-ordering": major
"@bitflow/task-matching": major
"@bitflow/task-parsons": major
"@bitflow/task-crossword": major
"@bitflow/task-word-search": major
"@bitflow/task-mouse-accuracy": major
"@bitflow/task-keyboard-speed": major
"@bitflow/task-code-trace": major
"@bitflow/task-graph-path": major
"@bitflow/task-number-representation": major
---

Rewrite bitflow as web components.

bitflow is now a set of custom elements — `<bitflow-flow>`,
`<bitflow-flow-editor>`, `<bitflow-report>`, `<bitflow-group-report>`, and one
per task type — usable from any framework or from plain HTML. React remains the
implementation behind them.

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
