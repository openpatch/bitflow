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

Choice, yes/no, short answer, fill in the blank and highlighting, plus start,
explanation, text and end screens. Each is its own package, so a page downloads
only the ones its assessment actually uses.

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

- Community: <https://matrix.to/#/#openpatch:matrix.org>
- Issues: <https://github.com/openpatch/bitflow/issues>

## Licence

MIT
