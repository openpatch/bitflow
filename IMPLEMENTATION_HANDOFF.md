# Bitflow Implementation Handoff

Use this alongside [`PLAN.md`](PLAN.md). `PLAN.md` defines product decisions
and ordered work; this document removes implementation ambiguity for the next
agent.

## 1. Current-to-Target Migration Map

Do not attempt a line-by-line port. Preserve behavior where it supports the
new product, but rebuild against the target contracts in `PLAN.md`.

| Current package/files | Target | Instruction |
| --- | --- | --- |
| `@bitflow/core`: `flowSchema.ts`, `bitsSchema.ts`, `doSchema.ts`, `flow.ts`, `do.ts`, helpers | `packages/bitflow-core` | Rebuild a versioned `.bitflow` envelope, conditions, attempt snapshots, registry, and pure engine. Reuse behavioral knowledge, not old schema/API compatibility. |
| `@bitflow/flow-engine`: `next.ts`, `previous.ts`, `collect.ts`, `distance.ts` | `bitflow-core` | Port and unit-test traversal/result collection as pure functions. Remove React dependencies. |
| `@bitflow/do` + `@bitflow/do-local` | `bitflow-core` attempt runtime | Merge into one client-only runtime. No remote adapter interface. It creates/restores serializable snapshots; the host persists them through component events. |
| `@bitflow/provider` | `packages/bitflow` | Replace Context/provider hooks with focused zustand stores. Keep state instance-scoped: two `<bitflow-flow>` elements on one page must never share attempts. |
| `@bitflow/shell`: progress/confidence/start/task/end shells | `packages/bitflow` | Port learner progression, confidence, reasoning, retry/skip, and feedback. Use plain CSS/theme tokens, not patches/emotion. |
| `@bitflow/flow`, `flow-node`, `flow-editor` | `packages/bitflow` | Build `<Flow>` and `<FlowEditor>` around `@xyflow/react`. Port useful node/edge behavior; redesign editor forms according to PLAN's teacher-first UX. |
| `@bitflow/start-simple`, `end-tries`, `title-simple`, `input-markdown` | individual `packages/bits/*` packages | Each owns task schema, React view, evaluator if needed, registry registration, and its standalone custom element. |
| `@bitflow/task-choice`, `task-yes-no`, `task-input`, `task-fill-in-the-blank`, `task-highlighting` | individual `packages/bits/*` packages | Port task behavior, answers, feedback, and evaluation. Replace patches/RHF wrapper components with native controls/CSS/direct RHF where useful. |
| `@bitflow/report-flow`, `stats` | `packages/bitflow-report` | Keep per-attempt reports plus group statistics. Export `<Report>` and `<GroupReport>` views; wrap as standalone `<bitflow-report>`/`<bitflow-group-report>`. Group functions take raw report arrays and do zero I/O. |
| `@bitflow/icons` | local `bitflow` UI components | Fold in small inline SVGs; do not retain a package boundary. |
| `@bitflow/date` | `bitflow-core` i18n utility | Fold locale-aware formatting into the lightweight i18n/date helper. |
| `@bitflow/mock` | test-local helpers | Move fixtures/builders next to the tests that use them; do not publish it. |
| `@bitflow/concept-model`, `concept-model-editor` | deleted | Do not port. |
| `@openpatch/patches`, `@emotion/*`, `@vocab/*` | deleted | Use plain CSS variables/CSS files and runtime JSON-catalog i18n. |
| `examples/`, Next.js `website/` | `platforms/web` | Replace with one Vite demo/playground that exercises standalone components. |
| no current VS Code package | `platforms/vscode` | Copy the architectural pattern from `../java-memory-playground/platforms/vscode`, changing `.jmp`/memory terminology to `.bitflow`/flow terminology. |

### Target package dependency direction

```text
bitflow-core  <- bits/*        (schemas, evaluator registration)
bitflow-core  <- bitflow-report (raw reports and pure stats)
bitflow-core  <- bitflow       (runtime/flow/editor)
bits/*        <- bitflow       (editor palette and flow rendering)
bitflow + bits/* + report <- web-component
web-component <- platforms/web, platforms/vscode
```

`bitflow-core` must never import React, custom-element wrappers, or a bit
package. Keep dependency arrows one-way to preserve lazy loading.

## 2. Stable Custom-Element Contract

All objects below are passed as **JavaScript properties**, not JSON strings in
HTML attributes. String attributes are only for small scalar values such as
`src`, `locale`, and `disabled`. Every component must be safely definable more
than once (`customElements.get(tagName)` guard) so multiple bundles do not
throw.

### `<bitflow-flow>`

| Property/method | Type | Meaning |
| --- | --- | --- |
| `flow` | `BitflowDocument \| string` | Full parsed `.bitflow` document or JSON text. Loading it is not a learner edit. |
| `src` | `string` | Optional URL to a `.bitflow` document. Fetch/parse failures dispatch `bitflow-error`. |
| `attempt` | `AttemptSnapshot \| string` | Complete saved attempt to validate and restore before/after loading `flow`. |
| `locale` | `string` | Requested UI locale; defaults to browser language/fallback English. |
| `readonly` | `boolean` | Show result/progress without accepting further learner changes. |
| `save()` | `() => AttemptSnapshot` | Dispatches `bitflow-save` and returns the current snapshot. |
| `reset()` | `() => void` | Starts a fresh attempt and dispatches its resulting state snapshot. |

`flow` and `attempt` changes must be atomic: validate first, then replace
state. A wrong-flow attempt, invalid JSON, unsupported schema version, or
unknown bit type must not partially replace a learner's current attempt.

### `<bitflow-flow-editor>`

| Property/method | Type | Meaning |
| --- | --- | --- |
| `flow` | `BitflowDocument \| string` | Document to edit. |
| `locale` | `string` | UI locale. |
| `readonly` | `boolean` | Inspect without mutation. |
| `getFlow()` | `() => BitflowDocument` | Returns the canonical current document. |
| `validate()` | `() => ValidationResult` | Returns schema, graph, and bit-specific validation diagnostics. |

It dispatches `bitflow-edit` after every material document change and
`bitflow-save` on its explicit save action. Editor `detail` is
`{ flow: BitflowDocument }`; no edit event fires while loading its `flow`
property.

### `<bitflow-report>` and `<bitflow-group-report>`

| Element | Input | Purpose |
| --- | --- | --- |
| `<bitflow-report>` | `report: AttemptReport \| string` | Render one raw learner report. |
| `<bitflow-group-report>` | `reports: AttemptReport[] \| string` | Compute and render aggregate browser-only statistics over a group. |

They dispatch `bitflow-error` for malformed/unsupported reports. Neither may
import the flow editor, `@xyflow/react`, or task packages just to render
reports.

### Every standalone bit element

Each bit package defines `bitflow-<type>` (for example
`<bitflow-task-choice>`). Its minimum common property API is:

| Property | Type | Meaning |
| --- | --- | --- |
| `data` | bit-specific data object | Authored configuration, validated by that bit's zod schema. |
| `answer` | bit-specific answer object | Optional initial/restored learner answer. |
| `readonly` | `boolean` | Render feedback/result without allowing mutation. |
| `locale` | `string` | UI locale. |

It dispatches `bitflow-answerchange` with `{ answer }` on a durable answer
change, and `bitflow-evaluated` with `{ answer, result }` when evaluated.
The component must work with no surrounding flow runtime.

### Event contract

All events are `CustomEvent`s with `{ bubbles: true, composed: true }`, so
they work through Shadow DOM and can be listened for at the host page.

```ts
type AttemptSnapshot = {
  schemaVersion: 1;
  flowId: string;
  flowSchemaVersion: number;
  attemptId: string;
  status: "inProgress" | "completed" | "abandoned";
  currentNodeId: string;
  answers: Record<string, unknown>;
  results: Record<string, unknown>;
  tries: Record<string, number>;
  confidence?: Record<string, unknown>;
  reasoning?: Record<string, string>;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

type AttemptReport = {
  schemaVersion: 1;
  flowId: string;
  flowSchemaVersion: number;
  attemptId: string;
  status: "completed" | "abandoned";
  nodeReports: Array<{
    nodeId: string;
    bitType: string;
    answer: unknown;
    result: unknown;
    tries: number;
    elapsedMs?: number;
  }>;
  score?: { earned: number; possible: number };
  startedAt: string;
  completedAt: string;
};

type BitflowError = {
  code:
    | "INVALID_FLOW"
    | "INVALID_ATTEMPT"
    | "FLOW_ATTEMPT_MISMATCH"
    | "UNKNOWN_BIT_TYPE"
    | "LOAD_FAILED"
    | "EVALUATION_FAILED";
  message: string;
  diagnostics?: Array<{ path: string; message: string }>;
};
```

| Event | Emitter | `detail` | When |
| --- | --- | --- | --- |
| `bitflow-statechange` | flow | `AttemptSnapshot` | Every durable learner-state change; not pan/zoom/focus. |
| `bitflow-save` | flow/editor | flow: `AttemptSnapshot`; editor: `{ flow }` | Explicit Save action or `flow.save()`. |
| `bitflow-complete` | flow | `{ attempt, report }` | Flow reaches terminal completion. |
| `bitflow-edit` | editor | `{ flow }` | Material authoring change; debounced by host if it writes a file. |
| `bitflow-answerchange` | bit | `{ answer }` | Durable standalone-bit answer change. |
| `bitflow-evaluated` | bit | `{ answer, result }` | A standalone bit evaluates. |
| `bitflow-error` | any | `BitflowError` | Typed recoverable load/validation/evaluation error. |

### IndexedDB host recipe

The host owns storage, user identity, assignment identity, retention, and any
sync. Bitflow never creates an IndexedDB database.

```js
const flow = document.querySelector("bitflow-flow");
const key = `course-42:assignment-7:learner-9`;

const db = await openBitflowHostDatabase(); // host implementation
const saved = await db.get("attempts", key);
if (saved) flow.attempt = saved;

flow.addEventListener("bitflow-statechange", debounce(async (event) => {
  await db.put("attempts", { key, snapshot: event.detail });
}, 250));

flow.addEventListener("bitflow-complete", async (event) => {
  await db.put("reports", { key, report: event.detail.report });
});
```

## 3. Golden Fixtures

Create these as committed JSON files when implementation begins. They are
inputs/expected outputs, not generated build artifacts.

| Fixture path | Purpose |
| --- | --- |
| `fixtures/flows/minimal.bitflow` | Start → title → task-choice → end, valid graph, English text. Smoke test loader/runtime/editor. |
| `fixtures/flows/all-initial-bits.bitflow` | One valid example of every initial nine bit type. Exercises eager editor imports and lazy learner imports. |
| `fixtures/flows/invalid-unknown-bit.bitflow` | Valid envelope but unknown `node.type`; expects `UNKNOWN_BIT_TYPE`. |
| `fixtures/flows/invalid-graph.bitflow` | Broken edge/reference/condition; expects structured validation diagnostics. |
| `fixtures/attempts/in-progress.json` | Snapshot midway through a choice/input flow, with answers, tries, confidence/reasoning, and a current node. |
| `fixtures/attempts/wrong-flow.json` | Same snapshot but mismatched `flowId`; expects `FLOW_ATTEMPT_MISMATCH`. |
| `fixtures/reports/single.json` | Completed raw report with correct/wrong/manual/unknown results. |
| `fixtures/reports/group.json` | Array of 5–10 reports with deliberately known aggregate values for mean, rank, correlation, and Cronbach's alpha tests. |
| `fixtures/editor/teacher-authored.bitflow` | The normal-case walkthrough: generated using visual editor, not hand-written JSON. |
| `platforms/vscode/example.bitflow` | Small valid file used by F5 Extension Development Host manual test. |

At minimum, assert every fixture against exported zod schemas. Do not test
only JSON parsing: assert flow behavior, snapshots, reports, events, and
expected statistics.

## 4. Acceptance-Test Matrix

The following are release gates, not optional future tests.

| Area | Required verification |
| --- | --- |
| Schema | Valid fixtures parse; malformed/unknown/graph-invalid fixtures produce typed diagnostics with paths. |
| Engine | Branching, retry, skip, terminal completion, previous/next, and condition evaluation are deterministic unit tests. |
| Bits | Each initial bit has schema, evaluator, standalone-element test, keyboard interaction test, and browser-only evaluation test. |
| Lazy loading | Loading `minimal.bitflow` downloads/registers only its referenced bit chunks. The editor intentionally loads all palette bits. |
| Element contract | Property loads do not emit user-edit events. Event names/details/bubbling/composition match section 2. Defining an element twice is harmless. |
| Attempt restore | Save an in-progress attempt after each answer; restore after a fresh component mount; current node, answers, evaluation, tries, confidence, reasoning, and progress match exactly. Wrong-flow/invalid snapshots emit `bitflow-error` and retain current state. |
| IndexedDB | A bare HTML test host receives `bitflow-statechange`, persists it through real/fake IndexedDB, reloads, assigns `attempt`, and resumes. No Bitflow package creates its own database. |
| Reports | Single report renders without flow/editor dependencies. Group report calculates known fixture aggregates client-side and renders without network requests. |
| Editor UX | Teacher can author the normal fixture through forms, see inline validation, use live preview, save, reopen, and get schema-identical JSON. |
| Accessibility | Keyboard completion of every initial bit; focus order; labels; visible focus; reduced-motion behavior; automated axe checks. Modality-specific tasks have an alternative/`notApplicable` route. |
| Visual theme | Screenshots or review verify OpenPatch colors, Montserrat, responsive layout, restrained motion, and no patches/emotion runtime. |
| Markdown security | Malicious HTML/URLs in `input-markdown` cannot execute scripts or event handlers after rendering. |
| VS Code | Opening `.bitflow` loads visual editor; `edit` writes the document and produces VS Code dirty/undo behavior; source-side edits update webview; Ctrl+S flushes latest debounce; preview runs learner flow without persisting preview state. |
| Build/package | ESM/types/CSS exports work; standalone report bundles do not include editor/xyflow/bits; full workspace build/lint/test passes. |

## 5. VS Code Implementation Recipe

Base the extension directly on
`../java-memory-playground/platforms/vscode`:

| Reference | Bitflow equivalent |
| --- | --- |
| `MemoryEditorProvider.ts` | `BitflowEditorProvider.ts` |
| `MemoryEditorProvider.viewType = "jmp.editor"` | `BitflowEditorProvider.viewType = "bitflow.editor"` |
| `*.jmp` selector/language | `*.bitflow` selector/language |
| `MemoryPlaygroundEditor` | `<bitflow-flow-editor>` / React editor |
| `MemoryPlayground` preview | `<bitflow-flow>` preview |
| `onEdit` → webview `edit` message | `bitflow-edit` → webview `edit` message |
| `onChange` → webview `save` message | `bitflow-save` → webview `save` message |
| `ready`, `edit`, `save`, `flushed`, `update`, `flush` protocol | Preserve exactly, with `content` containing canonical `.bitflow` JSON |

Required provider rules:

1. The `TextDocument` is the single source of truth.
2. Serialize flow JSON with two spaces and a trailing newline.
3. Track the exact own-write string; ignore only that matching document-change
   event to avoid throwing away webview selection/undo state.
4. Debounce webview editor writes, but on `onWillSaveTextDocument`, post
   `flush`, wait at most 500 ms, and return a `TextEdit` via `waitUntil`.
5. Preview is ephemeral: it uses the current in-memory editor flow but must
   neither modify the document nor enable IndexedDB attempt persistence.
6. Webview CSP permits only its nonce-bound script, bundled CSS, webview/data
   images, and bundled/data fonts. Never use unrestricted external scripts.

## Handoff Starting Point

The first implementation agent should:

1. Read `PLAN.md`, this document, `POSSIBLE_NEW_TASKS.md`, and
   `POSSIBLE_NEW_TASK_SCHEMAS.md`.
2. Make the target workspace/tooling and the fixtures in section 3 first.
3. Implement `bitflow-core` plus schemas/engine/snapshots/tests before any UI.
4. Build one vertical slice—`task-choice` standalone element → flow runtime →
   event/snapshot restore → report—before porting remaining bits.
5. Check the matching acceptance-matrix rows before marking each plan todo
   complete.
