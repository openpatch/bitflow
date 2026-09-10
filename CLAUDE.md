# CLAUDE.md

Notes for working in this repo. The [README](README.md) says what bitflow is;
this says how to change it without rediscovering things the hard way.

## Commands

```sh
pnpm install
pnpm build            # packages consume each other's dist — build before lint
pnpm lint             # tsc --noEmit everywhere
pnpm test             # vitest run everywhere
pnpm --filter @bitflow/task-crossword test    # one package
pnpm --filter web dev                          # the gallery, localhost:5173
```

Node 22+, pnpm 9+. pnpm only — `preinstall` enforces it.

Build, lint and test must all pass before a commit. Lint after build, not
before: a package type-checks against its siblings' `dist`, so a stale `dist`
gives a stale answer.

## Layout

- `packages/bitflow-core` (`@bitflow/core`) — schema, flow engine, attempt
  runtime, bit registry, i18n, `theme.css`. **Pure TypeScript, no React.**
  Anything imported here must run in Node.
- `packages/bitflow-element` (`@bitflow/element`) — the React layer bits share:
  `defineBitElement`, `BitView`, form fields, `usePointerDrag`, `Markdown`.
- `packages/bits/*` — one package per bit. `task-*` are graded; `start-*`,
  `end-*`, `title-*`, `input-*` are not.
- `packages/web-component` — the shipped custom elements, and the cross-cutting
  tests (a11y, theme, catalogs, fixtures) that hold every package to the
  conventions below.
- `platforms/web` — the demo gallery. `platforms/vscode` — the editor extension.
- `platforms/party` — the PartyKit server for live sessions. Private, not
  published; in `.changeset/config.json`'s `ignore` beside `web` and
  `bitflow-studio`.
- `fixtures/` — committed valid and deliberately broken flows.

## Live sessions

`platforms/party` plus the host/join pages in `platforms/web` run a flow *with
a class*. Three constraints shape them, and must not be broken:

- **The packages stay transport-free.** `@bitflow/core`, `@bitflow/bitflow` and
  `@bitflow/web-component` learn nothing about sockets or sessions. The one
  runtime addition is `lockedNodeIds` on `<Flow>` — a host-supplied constraint
  in exactly the same shape as `readonly`. The socket lives entirely in
  `platforms/`.
- **The server stores results, never content.** The room holds a flow URL, a
  lock list, and one stripped report per participant. It never imports
  `@bitflow/core` (it never parses a document) and must not import
  `@bitflow/report` at runtime — that package's index calls `injectStyles` at
  module scope. It is a type-only devDependency for the drift assertion in
  `room.test.ts`.
- **Answers never leave the learner's browser.** The student's page builds a
  report and drops `answer` from each node report before it goes anywhere. The
  protocol declares the node report with `z.strictObject`, so a frame
  carrying an `answer` key is rejected by the schema itself. A modified
  client cannot push answers to the host even deliberately.
- **Results never reach the rest of the class.** A participant row carries a
  name and a stripped report, so it leaves the server only as a `toHosts`
  effect, resolved from the rows in `server.ts` rather than from a list the
  reducer built. The `session` frame is the one everybody gets, and it carries
  the flow and the locks and nothing about anybody. Do not put a row on a
  broadcast: a student page not drawing the board is no protection at all.

The room logic is a pure `applyMessage(state, from, message)` reducer in
`platforms/party/src/room.ts`, so it is testable without a worker.

## Adding a bit

A bit is `registerBit<Data, Answer>({...})` plus `defineBitElement(TYPE)` in
`src/index.ts`. Copy the nearest existing package; the shape is
`schema.ts` (zod, plus pure helpers), `evaluate.ts`, the task component,
`views.tsx` (`Task` and `Form`), `messages.ts`, `formMessages.ts`,
`<type>.css`, tests beside each.

Then wire it up — every one of these, or something silently does not know
about the new bit:

1. `packages/web-component/src/bitLoaders.ts` — the lazy-import map.
2. `platforms/web/src/bits.ts` — the gallery's separate map.
3. `package.json` dependencies in both of those packages.
4. `packages/web-component/src/a11yFixture.ts` — a fixture node.
5. `platforms/web/src/examples.ts` — a gallery example.
6. `.changeset/initial-web-component-rewrite.md` — `"@bitflow/<name>": major`.
7. `packages/web-component/README.md` — a section, including accessibility.
8. `POSSIBLE_NEW_TASKS.md` — mark it built.

Steps 2, 5 and 8 are for task bits only: the gallery shows one question at a
time and has no use for a start or an end, and `POSSIBLE_NEW_TASKS.md` is a
backlog of tasks. A new `start-*`/`end-*` bit still needs all the others.

An `end` bit cannot join the single chain in `a11yFixture.ts` — an end is
terminal, so a walk only ever reaches one. Put it in `extraSteps` instead, which
`a11y.test.ts` mounts standalone with the fixture attempt and document.

Both import maps are written out literally on purpose. A computed specifier
(`import("@bitflow/" + type)`) defeats code splitting and pulls every bit into
one chunk.

## Conventions the tests enforce

- **Theme variables.** A stylesheet may only use `--bitflow-*` tokens defined
  in `packages/bitflow-core/src/theme.css`. A component's *own* variable must
  carry a fallback — `var(--my-thing, 2.25rem)` — which is how it declares
  itself local. `theme.test.ts`.
- **Message catalogs.** `messages.ts` is learner-facing, `formMessages.ts` is
  authoring; they stay split. Every locale a catalog lists must have *every*
  key in it. en + de only is fine — listing a locale you have not translated is
  the failure. `catalogs.test.ts`.
- **Accessibility.** `a11y.test.ts` runs axe over the assembled elements, and
  `formsA11y.test.tsx` over every bit's authoring form — the teacher's half
  counts too. Both live in `web-component`, and both use the shared
  `a11yFixture.ts`.
  Rules needing layout are off (jsdom has none), so contrast and target size
  still need a real browser. Keyboard operation is part of the task, not a
  fallback bolted on after: if it can be done with a pointer, it has a key.
- **Authoring forms are built from `@bitflow/element`'s fields**, not from raw
  inputs: `Field`, `TextField`, `SelectField`, `CheckboxField`, `Disclosure`,
  `errorFor`. A list of items is a `Disclosure` per row driven by `usePanels`,
  which opens the rows that appear — "Add a word" that hands back a collapsed
  row called *Unnamed* is a click that says nothing. A panel per row is for
  rows with several fields; a row with one or two gets a single compact line
  (`task-code-trace`), and a list of short strings gets a textarea
  (`task-word-search`, `task-parsons`). Use `errorAt` for the message above a
  list whose members the form also renders — `errorFor` matches deeper paths
  too and would print it twice.
- **CSS ships inside the JS**, via `?inline` + `injectStyles(id, css)`. There is
  no separate stylesheet for a consumer to remember.

## Traps

- **MathLive cannot be mounted under jsdom.** Its `connectedCallback` throws
  from inside a custom-element callback, where nothing here can catch it.
  `MathAnswer.test.tsx` mocks the module; `formsA11y.test.tsx` takes away the
  `ResizeObserver` stub so `loadMathfield` takes the fallback it already has.
  This is also why `a11y.test.ts` passed the maths step for a long time without
  checking anything: the lazy import had not arrived before axe ran.
- **`parseFlow` does not check bit `data`.** That is deliberate — a host
  without a bit package loaded must still be able to open and re-save a file
  that uses it — but it means a `Form` is handed whatever the document says,
  including fields written against an older version of the bit. `BitView`
  `safeParse`s before rendering a `Task`; the editor merges the bit's defaults
  under the node data and wraps the form in `FormBoundary`, so a form that
  throws anyway costs the step and not the canvas.
- **Vite is pinned to 7**, `@vitejs/plugin-react` to 5. Vite 8 (Rolldown) leaves
  `require("react")` unresolved inside use-sync-external-store's CJS shim,
  reached via `@xyflow/react` → zustand 4. The bundle throws on load. The
  pin is commented in every vite config; do not bump it casually.
- **The gallery serves built `dist`.** Editing a bit's source and reloading the
  browser shows the old code. `pnpm build` first, or run the bit's `dev`
  (`vite build --watch`) alongside.
- **`cqw` units** only work on a *child* of the `container-type` element, never
  on the element itself. A letter sized `55cqw` on its own container renders one
  enormous letter.
- **Sizing must not be circular.** Cells at `calc(100% / columns)` inside a
  `width: fit-content` parent collapse to a smear. Size the grid from the count
  and let the cells divide it.
- **Drag distance is measured from where the drag began**, not from the last
  pointer event. Per-step deltas mean a slow drag never passes the threshold,
  and the click that follows then undoes the drag. Keep `fromX`/`fromY` in the
  drag state. Regression tests drag a pixel at a time.
- **Key list rows by their id**, not by index. Index keys destroy and rebuild
  the DOM node on a reorder, which drops keyboard focus mid-drag.
- **Positions are stored as fractions (0–1)**, never pixels.
- **The gesture pattern** is: state in a ref, `useReducer` to redraw,
  `usePointerDrag(onMove, onEnd)` subscribed for the component's whole life, and
  a `dragged`/`placed` ref to swallow the click that follows a drag.
- **React renders before your click handler runs.** A focus-driven re-render
  makes "was the cursor already here?" always true. Record the state at
  `onPointerDown` in a ref and read that.
- **`preventDefault` on a pointer press cancels focus too.** If you need it (to
  stop a selection smear), call `element.focus()` yourself.

## Flow control

- **Branching lives on edges.** A condition reads one value out of the running
  attempt — a result, an answer, tries, `visits`, `confidence`, the clock, or a
  count/score that may be scoped to a section, a list of nodes, or the last few
  answered. Everything a branch can read is gathered once by
  `conditionContext(doc, snapshot, now?)`; nothing is derived at compare time,
  so replaying a context always picks the same path.
- **Absent is not zero.** `confidence` for a step nobody was asked about, and
  `timeRemaining` with no limit set, resolve to `undefined`, and every ordering
  comparison against `undefined` is false. `Number(undefined)` is `NaN`, not
  `0` — which is what keeps "less than half sure" from firing for everyone the
  question skipped. Do not "fix" this with a default.
- **A loop needs `resetTarget` on the edge.** Landing back on a task that
  already has a result shows the old answer, marked, with no way to change it.
  `"result"` clears the grading and keeps the draft; `"answer"` clears both,
  for a task that measures rather than asks. The try count is never cleared.
- **A shuffled pool navigates by its drawn order, not its wiring.** So it needs
  exactly one way out, which `validateFlow` checks. The way in needs no rule:
  every edge into one lands on whichever member the draw put first. With no draw
  recorded — an older snapshot — it is walked exactly as wired, on the same
  reasoning as `isActiveNode`: missing data must not change what is shown.
- **`isComplete` gates Next for a step that is not graded but must be done.**
  The runtime only disables the button; saying what is missing is the bit's
  job, and the reason has to render *above* the button and before it in reading
  order, or a keyboard user meets a dead control with no explanation.
- **`validateFlow` is where a silent branch gets caught.** A rule that can
  never fire still runs the flow, and the teacher never finds out. Anything new
  a condition can read needs a matching check in `validateCondition.ts`.

## Scoring and answers

- `BIT_RESULT_STATES = ["correct", "wrong", "unknown"]`. `unknown` scores
  `{earned: 0, possible: 0}` — that is how "not applicable" is expressed, and
  what an opt-out returns. There is no separate `notApplicable`.
- **Retry clears the result, keeps the answer**
  (`defineBitElement.tsx`, `setResult(undefined)`). Right for a draft answer —
  a crossword comes back with its letters. Wrong for a *recorded run*: a timed
  or measured task must start over, so watch the readonly→live transition and
  reset the answer yourself.
- **A displayed figure and the scored figure must be the same value.** A live
  timer alongside a recorded interval showed 17.2 s for something marked at
  8.0 s. Render the value from the answer.

## Privacy constraints in the measurement tasks

Both are asserted by tests over the exact key set of a stored answer. Do not
widen them.

- `task-mouse-accuracy`: task-scoped round results only — never raw pointer
  telemetry or anything identifying a device.
- `task-keyboard-speed`: never capture keys outside its own focused input, and
  never store a key-by-key log. Text is read from the input's `value` on
  change, which is also what makes IME composition work.

## Testing

Unit tests run in jsdom, which has no layout. Expect to stub
`getBoundingClientRect` on anything you measure. `fireEvent.change` with an
unchanged value fires nothing, and a controlled component with a `vi.fn()`
onChange never updates — use a stateful wrapper when the assertion depends on
state.

**Verify in a real browser before calling a bit done.** Circular CSS sizing,
focus versus `preventDefault`, render-before-click ordering and display-versus-
score mismatches all pass the test suite. Every one of them was found by
opening the page.
