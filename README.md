<div align="center">

[![](https://raw.githubusercontent.com/openpatch/branding/main/logos/png/bitflow-circle-mixed_256.png)](https://openpatch.org)

</div>

# bitflow

Assessments built from small, reusable tasks — authored visually, taken in the
browser, embeddable anywhere as web components.

```html
<script type="module" src="https://unpkg.com/@bitflow/web-component"></script>

<bitflow-flow src="./fractions-check.bitflow"></bitflow-flow>
```

No framework required, no server involved. Everything — rendering, grading,
scoring and statistics — happens in the page.

That last part is a design decision with a cost, and the cost decides what
bitflow is for. **Read [What bitflow is not for](#what-bitflow-is-not-for)
before using it on anything that counts towards a grade.**

## What bitflow is not for

Grading in the browser means the browser has everything it needs to grade —
and so does the learner.

- **Every correct answer is in the file.** `correct: true` on a choice, the
  accepted strings for a short answer, the reference highlighting: a
  `.bitflow` document carries them all, and the page downloads it whole.
  Devtools, or just fetching the URL, shows the answer key.
- **The grading runs where the learner is.** It is ordinary JavaScript in
  their page. They can change what it does.
- **Attempts are supplied by the host and taken at face value.** bitflow
  checks a restored snapshot against the schema, not against reality — a
  hand-written snapshot with a perfect score is accepted exactly like an
  earned one.

None of this is a bug to be fixed, and no amount of obfuscation changes it.
It follows from having no server. So:

**Good for** practice, self-check, worked examples, homework where the point
is the doing, formative classroom use, and anything a learner has no reason
to cheat at.

**Not suitable for** exams, placement tests, certification, or any graded
assessment a learner benefits from passing.

Making it suitable would take a server that keeps the answers, receives
responses and grades them — deliberately outside this project's scope. If you
need that, bitflow's schema and editor are still useful to author with; the
grading has to move.

## What is here

| Package | What it is |
| --- | --- |
| [`@bitflow/core`](packages/bitflow-core) | The `.bitflow` schema, the flow engine, the attempt runtime, the bit registry and the i18n helper. Pure TypeScript. |
| [`@bitflow/element`](packages/bitflow-element) | Renders a registered bit, sanitises author Markdown, and wraps any bit as a standalone custom element. |
| [`@bitflow/bitflow`](packages/bitflow) | React `<Flow>` (take it) and `<FlowEditor>` (author it). |
| [`@bitflow/report`](packages/bitflow-report) | Per-attempt reports and cohort statistics, plus `<Report>` and `<GroupReport>`. |
| [`@bitflow/web-component`](packages/web-component) | All of the above as custom elements, with lazy per-task loading. |
| [`packages/bits/*`](packages/bits) | One package per task type. |
| [`platforms/vscode`](platforms/vscode) | Bitflow Studio — a visual editor for `.bitflow` files. |
| [`platforms/web`](platforms/web) | Demo pages for each of the above. |

## Task types

Choice, yes/no, short answer, fill in the blank, highlighting and drag and
drop, plus start, explanation, text and end screens. Each is its own package,
so a page downloads only the ones its assessment actually uses.

More are planned: [`POSSIBLE_NEW_TASKS.md`](POSSIBLE_NEW_TASKS.md) is the
backlog, and [`POSSIBLE_NEW_TASK_SCHEMAS.md`](POSSIBLE_NEW_TASK_SCHEMAS.md)
sketches the data each would carry.

## Languages

Set `locale` on any element, or let it fall back to the flow's own
`meta.locale`.

**Taking an assessment** works in English, German, French, Dutch, Spanish,
Italian, Portuguese and Turkish. Every string a learner reads is translated in
all eight.

**Authoring** — the editor, the inspector and each task's form — is English
and German only.

The split is deliberate, and enforced: a catalog is complete for every locale
it declares, and `packages/web-component/src/catalogs.test.ts` fails if it is
not. `translate` falls back to English for anything missing, which makes a
half-translated catalog invisible at runtime, so the guarantee has to be a
test rather than a habit. Adding a language means translating a catalog
whole — bits keep their learner strings and their form labels in separate
catalogs precisely so that is a reasonable amount of work.

## The custom elements

| Element | Purpose |
| --- | --- |
| `<bitflow-flow>` | Take an assessment. |
| `<bitflow-flow-editor>` | Author one. |
| `<bitflow-report>` | Show one learner's result. |
| `<bitflow-group-report>` | Show a class's results, with item difficulty, discrimination and reliability. |
| `<bitflow-task-choice>`, … | Any single task, on its own, with no flow around it. |

Full property, method and event reference:
[`packages/web-component/README.md`](packages/web-component/README.md).

## Saving progress

bitflow stores nothing. It reports every durable change through a
`bitflow-statechange` event carrying a complete, versioned snapshot, and accepts
one back through the `attempt` property. Identity, retention and sync belong to
whatever embeds it — so does the database.

```js
flow.addEventListener("bitflow-statechange", (event) => save(event.detail));
flow.attempt = await load();
```

## Developing

```sh
pnpm install
pnpm build      # packages consume each other's dist, so build before linting
pnpm lint
pnpm test
pnpm --filter web dev
```

Requires Node 22+ and pnpm 9+.

Committed fixtures live in [`fixtures/`](fixtures): valid and deliberately
broken flows, an in-progress attempt, and result data with known aggregates.

## Links

- Security and threat model: [`SECURITY.md`](SECURITY.md)
- Community: <https://matrix.to/#/#openpatch:matrix.org>
- Issues: <https://github.com/openpatch/bitflow/issues>

## Licence

MIT
