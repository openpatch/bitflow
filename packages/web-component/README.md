# @bitflow/web-component

bitflow as custom elements, usable from any framework or from plain HTML.

```html
<script type="module" src="./node_modules/@bitflow/web-component/dist/index.js"></script>

<bitflow-flow src="./assessment.bitflow"></bitflow-flow>
```

There is no stylesheet to link: each package carries its own CSS and adds it on
import. A flow resolves its task types at runtime, so no page could know which
stylesheets to include anyway.

Four entry points, so a page pays only for what it uses:

| Import | Defines |
| --- | --- |
| `@bitflow/web-component` | all of the below |
| `@bitflow/web-component/flow` | `<bitflow-flow>` |
| `@bitflow/web-component/editor` | `<bitflow-flow-editor>` |
| `@bitflow/web-component/report` | `<bitflow-report>`, `<bitflow-group-report>` |

Every element is safe to define twice, so loading both the combined bundle and
a single-surface one does not throw.

## Passing data

Objects go in as **JavaScript properties**, not as JSON in attributes:

```js
document.querySelector("bitflow-flow").flow = myDocument;
```

Attributes are for scalars only — `src`, `locale`, `readonly`. Both forms are
accepted for `flow` and `attempt`, so a JSON string works too.

## `<bitflow-flow>`

Takes an assessment.

| Property / method | Type | Meaning |
| --- | --- | --- |
| `flow` | `BitflowDocument \| string` | The document. Loading it is not a learner edit. |
| `src` | `string` | URL to fetch a document from. Failures emit `bitflow-error`. |
| `attempt` | `AttemptSnapshot \| string` | A saved attempt to validate and restore. |
| `locale` | `string` | UI language; falls back to English. |
| `readonly` | `boolean` | Show the run without accepting input. |
| `save()` | `() => AttemptSnapshot \| null` | Emits `bitflow-save` and returns the snapshot. |
| `reset()` | `() => void` | Starts a fresh attempt. |

Only the bit packages a document actually references are downloaded, as
separate chunks, the first time that document is loaded.

## `<bitflow-flow-editor>`

Authors an assessment. Loads the whole bit palette up front.

| Property / method | Type | Meaning |
| --- | --- | --- |
| `flow` | `BitflowDocument \| string` | Document to edit. |
| `src` | `string` | URL to fetch one from. |
| `locale` | `string` | UI language. |
| `readonly` | `boolean` | Inspect without changing. |
| `getFlow()` | `() => BitflowDocument` | The canonical current document. |
| `validate()` | `() => ValidationResult` | Schema, graph and bit-specific diagnostics. |
| `save()` | `() => BitflowDocument` | Emits `bitflow-save` and returns the document. |
| `undo()` / `redo()` | `() => void` | Step through the edit history. |

## `<bitflow-report>` and `<bitflow-group-report>`

| Element | Property | Purpose |
| --- | --- | --- |
| `<bitflow-report>` | `report: AttemptReport \| string` | One learner's result. |
| `<bitflow-group-report>` | `reports: AttemptReport[] \| string` | Cohort statistics over an array of them. |

Both compute and render entirely in the browser, and neither loads the flow
runtime, the editor or any bit package.

## Events

All are `CustomEvent`s with `bubbles: true` and `composed: true`, so they cross
a shadow boundary and can be listened for on the page.

| Event | From | `detail` | When |
| --- | --- | --- | --- |
| `bitflow-statechange` | flow | `AttemptSnapshot` | Every durable learner-state change. Never pan, zoom or focus. |
| `bitflow-save` | flow | `AttemptSnapshot` | Explicit save, or `save()`. |
| `bitflow-save` | editor | `{ flow }` | Explicit save, or `save()`. |
| `bitflow-complete` | flow | `{ attempt, report }` | The flow reaches its end. |
| `bitflow-edit` | editor | `{ flow }` | Every material authoring change. |
| `bitflow-error` | any | `BitflowError` | A typed, recoverable load, validation or evaluation problem. |

Individual bit elements (`<bitflow-task-choice>` and friends) additionally emit
`bitflow-answerchange` with `{ answer }` and `bitflow-evaluated` with
`{ answer, result }`.

### `BitflowError`

```ts
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

An invalid or mismatched `attempt` emits `bitflow-error` and leaves the current
attempt untouched. It is never partially restored.

## Branching

An edge without a condition is always followed. One with a condition is
followed only when it holds, and conditional edges are considered before
unconditional ones — so an edge with no condition acts as the "otherwise"
branch however it was drawn.

A condition compares one value out of the running attempt:

| Value | What it is |
| --- | --- |
| `{ kind: "result", nodeId, path: "state" }` | How one task turned out. |
| `{ kind: "answer", nodeId, path }` | What the learner answered, at a dot path. |
| `{ kind: "tries", nodeId }` | How many attempts one task took. |
| `{ kind: "resultCount", state }` | How many tasks ended in that outcome — `state` defaults to `"correct"`. |
| `{ kind: "score" }` | Points earned so far. |
| `{ kind: "scoreRatio" }` | Earned over possible, in `[0, 1]`. |

Compared with `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn` or `isTrue`,
and combined with `and`, `or` and `not`.

An outcome is `correct`, `wrong` or `unknown` (skipped, or a task with grading
switched off). There is no "awaiting a teacher" outcome: bitflow grades in the
browser and has no server, so nothing here could ever resolve one.

"Once they have at least three right, move on":

```json
{
  "id": "to-harder",
  "source": "q3",
  "target": "harder",
  "condition": {
    "type": "compare",
    "left": { "kind": "resultCount", "state": "correct" },
    "op": "gte",
    "right": 3
  }
}
```

`resultCount` counts *tasks*, not points: a partly-credited answer counts once,
and only if it reached the outcome being counted. Use `score` when partial
credit should carry weight. It counts only the tasks the learner has actually
reached, so a branch can fire mid-flow.

Several rules can apply to one connection. "At least eight correct, but
question 1 wrong" is two rules joined by `and`:

```json
{
  "condition": {
    "type": "and",
    "conditions": [
      {
        "type": "compare",
        "left": { "kind": "resultCount", "state": "correct" },
        "op": "gte",
        "right": 8
      },
      {
        "type": "compare",
        "left": { "kind": "result", "nodeId": "q1", "path": "state" },
        "op": "eq",
        "right": "wrong"
      }
    ]
  }
}
```

The editor builds exactly that — a list of rules joined by all-of or any-of —
through dropdowns. Anything more deeply nested is written in the `.bitflow`
file and shown read-only rather than rewritten.

### What the editor checks

`validate()` reports the ways a branch can be written so that it never fires,
which otherwise fail silently — the flow still runs and the teacher never finds
out. It flags a threshold higher than the number of tasks before the
connection, a rule reading a task the learner cannot have reached yet, a node
that is not a task, an outcome that does not exist, an ordering comparison
against something that is not a number, a membership test without a list, and
an empty rule set.

## Scoring and time

Both live on the flow document, so a host that only embeds the elements has
nothing to configure.

| Where | Field | Meaning |
| --- | --- | --- |
| `node.data.evaluation` | `weight` | What the task is worth relative to the others. Defaults to `1`. The runtime multiplies the bit's own score by it, so every bit supports weighting without implementing it. `0` makes a task practice: it counts for nothing and leaves the total alone. |
| `node.data.evaluation` | `timeLimit` | Seconds on this task, counted from arrival. Omit for no limit. |
| `meta` | `timeLimit` | Seconds for the whole assessment. Omit for no limit. |

Both clocks count time **spent**, not wall clock: they are recomputed from the
attempt on every tick, so closing the tab pauses them and reloading resumes
with the time already used. When a task's time runs out the answer is
submitted rather than thrown away — a half-finished answer is still what the
learner had. When the assessment's time runs out the attempt is completed and
`bitflow-complete` fires, the same as reaching the end.

## Accessibility

Arriving at a step moves focus to its content and announces it — "Step 3.
Capital of France?" — in a live region. Without that, pressing Next leaves
focus on a button whose meaning has changed underneath it, and a screen reader
says nothing about the new question. The first render is deliberately exempt:
an element must not take focus away from the page that embedded it. Countdowns
only announce themselves in their final thirty seconds, since a clock that
speaks every second makes a screen reader unusable.

## Saving and resuming an attempt

bitflow does not persist anything. It has no way to know who the learner is,
which assignment this is, how long results should be kept, or whether they
should sync — so the host owns storage, and bitflow reports every durable
change through `bitflow-statechange`.

```js
const flow = document.querySelector("bitflow-flow");
const key = "course-42:assignment-7:learner-9";

const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open("my-app", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("attempts");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const read = (store, k) =>
  new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(k);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const write = (store, k, value) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, k);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

// Restore before the learner sees anything.
const saved = await read("attempts", key);
flow.flow = await (await fetch("./assessment.bitflow")).json();
if (saved) flow.attempt = saved;

// Debounce: a snapshot arrives on every answer, and IndexedDB writes are not
// free. 250 ms is short enough that a closed tab loses nothing that matters.
let pending;
flow.addEventListener("bitflow-statechange", (event) => {
  clearTimeout(pending);
  const snapshot = event.detail;
  pending = setTimeout(() => write("attempts", key, snapshot), 250);
});

flow.addEventListener("bitflow-complete", (event) => {
  write("reports", key, event.detail.report);
});

flow.addEventListener("bitflow-error", (event) => {
  console.warn("bitflow:", event.detail.code, event.detail.message);
});
```

The snapshot records the flow it belongs to, so restoring it into a different
assessment fails loudly instead of silently mixing two runs together.
