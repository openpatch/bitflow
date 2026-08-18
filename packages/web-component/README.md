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

## Arranging the canvas

Node positions live in the document and were only ever set by hand, so a flow
that came from anywhere else — generated, converted, or merged from two files —
opened as a heap at the origin. `<bitflow-flow-editor>`'s **Arrange** button
lays every step out top to bottom in the order a learner meets them, branches
side by side, in a single undoable step.

A step is always drawn below everything that can reach it. Anything the start
cannot reach is laid out below the rest as its own flow, which is what a
half-built document looks like most of the time.

## Sizing the inspector

`<bitflow-flow-editor>` puts a grip between the canvas and the settings panel.
Drag it, or focus it and use the arrow keys — it is a real `separator` that
reports its width, so the panel is adjustable without a pointer. It will not go
below 280px, nor take more than 60% of the editor: the canvas is the thing
being edited.

The width is not saved into the document. It is what one person needs while
looking at one screen, not a property of the assessment, and writing it to the
file would push a preference at everyone the file is sent to.

## Previewing one step

`<bitflow-flow-editor>`'s Preview button starts at the beginning, or — when a
step is selected on the canvas — at that step, which is what the button says it
will do. Answering the nineteen steps in front of the twentieth to check the
twentieth is not a reasonable thing to ask of its author.

Nothing before the chosen step has been answered, so a branch whose condition
reads an earlier task takes its default route. The preview says so.

`attemptAt(doc, nodeId)` in `@bitflow/core` builds the same snapshot if you
want this outside the editor.

## Exporting results

`<bitflow-group-report>` renders a **Download CSV** button. The file holds two
tables separated by a blank line — one row per learner with a score and an
outcome column per task, then one row per task with its difficulty,
discrimination and average tries. Spreadsheets import that as a single sheet
with a gap.

A task a learner never reached is left blank rather than zero: the blank is a
fact about the flow, a zero would be a claim about the learner. The file opens
with a UTF-8 BOM so Excel does not turn `Müller` into `MÃ¼ller`.

`toCsv(statistics, reports, { headers })` is exported from `@bitflow/report`
if you would rather build the file yourself.

## Reliability on a branching assessment

`<bitflow-group-report>` reports Cronbach's α, which assumes every learner
answered every item. Branching exists so that they do not.

α is therefore computed over the items *every* learner reached, and the report
says how many that was whenever it is fewer than the whole assessment. Read it
as a statement about that common core, not about the assessment. If the core
is smaller than three items there is no α to report, and the tile says so.

It previously ran over every item, scoring an unreached one 0 — which both
confuses "never saw it" with "got it wrong" and manufactures agreement between
items. On a realistic branched cohort that turned an α of 0.27 into 0.62.

## Answers are visible to the learner

`<bitflow-flow>` grades in the page, so the page holds the answer key: the
document you pass to `src` or `flow` contains every correct choice, every
accepted string and every reference highlighting, and the learner can read it.
The `attempt` you hand back is validated against the schema, not against what
actually happened, so a forged snapshot scores whatever it claims.

Design the surrounding product accordingly — practice and formative work, not
exams. [What bitflow is not for](../../README.md#what-bitflow-is-not-for) has
the full picture, and [SECURITY.md](../../SECURITY.md) says which of this we
treat as a bug (none of it) and which we do.

## Pictures are stored, not linked

Every picture a task uses is embedded in the `.bitflow` document as a `data:`
URI. A file is mailed between teachers, dropped into a VLE, opened from a
memory stick and taken into a classroom with no network — a linked image breaks
on all of those, usually in front of a class.

That costs file size, so the authoring form spends it deliberately. Choosing a
picture scales it to at most 1600px on its longest edge and re-encodes it:
JPEG, unless any pixel is transparent, in which case PNG — a logo encoded as
JPEG comes back with a black background. SVG is passed through untouched, being
already small and already scalable. A 5 MB photograph typically lands at around
250 kB. The form shows what the picture costs, and re-encoding is skipped when
it would make the file bigger.

Alternative text sits in the same field as the picture, because they are one
decision: an image with no description is a task that does not exist for part
of the class. The file name seeds it as a first draft to correct.

A plain URL still loads, so documents written before this keep working, and the
editor flags one where it finds it.

`ImageField` and `readImageFile` are exported from `@bitflow/element`, and
`ImageSchema` from `@bitflow/core`, for tasks added later.

## Match up

`<bitflow-task-matching>` follows H5P's Image Pair: two shuffled columns, and a
point for each pair the learner puts back together. A card left unmatched
simply earns nothing — leaving one alone is not a claim about it.

Both sides are written out. H5P lets the right side be omitted, which quietly
means "match this picture to a copy of itself" — a second mode hiding in an
absent field. An author who wants that writes the same thing twice. Text as
well as pictures, since matching a term to its definition is the commonest
version of this.

The columns are shuffled independently and seeded from the attempt: line them
up and the task becomes "match row one to row one", and a reload must not deal
a new hand around the pairings already made.

### Accessibility

Choose a card on the left, then the one on the right that goes with it — two
clicks, two taps or two Enters, the same operation whatever drives it. Nothing
here is spatial, so a list is not a fallback for dragging; it is the shape of
the question. Choosing an occupied card while holding one means "put this here
instead" rather than refusing.

Each pairing is drawn as a line between its two cards, and both carry the
pairing's number. Three ways of saying the same thing, because none of them
works everywhere: the line is unavailable when the columns stack on a narrow
screen, the number survives that but not a screen reader, and the card's
accessible name — "CPU, matched with Carries out instructions" — covers what
neither can. The line takes the outcome's colour once the answer is marked.

## Put in order

`<bitflow-task-ordering>` follows H5P's Image Sequencing: the order the author
writes is the right order, the learner is given the items shuffled, and every
item that ends up in its authored place is worth a point. An ordering that is
right except for one transposed pair has clearly been understood, and
all-or-nothing would say otherwise.

Widened to text as well as pictures. H5P's is images only, but the same task is
how you ask for the steps of an algorithm, and there is no reason to make a
teacher screenshot a sentence.

The shuffle is seeded from the attempt: stable across a reload — coming back to
find the items rearranged around what you had already moved would be worse than
no shuffle at all — and different between learners without being stored
anywhere. It is also never the answer, so nobody is handed a full mark for
doing nothing.

An answer records item ids rather than positions, so it survives the author
reordering or renaming, and a stale answer naming a deleted item is reconciled
rather than silently misread.

### Accessibility

Reordering is the same two decisions however it is done — take this one, put it
there — so the pointer and the keyboard share one operation rather than one
being a fallback.

With a pointer the item is lifted: it follows the cursor at the size it was
picked up, and the list opens a gap where it would land, the others moving
apart to make room. The order is committed once, on release, so the answer is
where the item was put down rather than every position it passed through. The
arrow keys do the same a step at a time. Both announce where the item ended up,
because a list that silently rearranges itself cannot be used without sight.

## Find the spot

`<bitflow-task-find-hotspots>` follows H5P's Image Hotspot Question: a picture,
some regions over it, and one click. The task is worth one mark, not one per
region — the learner is asked where something is and answers once.

Several regions may be correct; any of them wins. The rest are there to be
wrong usefully: each carries its own feedback, so choosing the monitor can say
*that shows output rather than taking it in* instead of showing a red cross.
`missFeedback` covers a click on bare picture.

Regions are never drawn before the answer — outlining the candidates would
answer the question — and are rectangles or the ellipse inside the same box, so
the editor draws either by dragging one rectangle. A region drawn later wins
where they overlap, which is how an exception is carved out of a larger area.
After marking, the region that was actually hit is outlined, so a near miss
looks like a near miss.

### Authoring

Drag on the picture to draw a region, drag it to move, drag its corner to
resize; the numeric fields do the same. The gesture is `BoxEditor` from
`@bitflow/element`, shared with drag and drop. Each region needs a name. It is never
shown to a learner — it describes the region to anyone who cannot see the
picture, and names it in the report.

### Accessibility

The learner aims at a point, and a keyboard can move a point exactly as freely
as a pointer can: the picture is one focusable control with a crosshair the
arrow keys move (Shift for bigger steps) and Enter commits. Nothing is revealed
that a mouse user is not also working from — the announcement is a position,
never which region is under it, and choosing says only that a choice was made.
Alternative text for the picture is required.

## Drag and drop

`<bitflow-task-drag-drop>` follows H5P's Drag and Drop question: elements sit
on the picture where the author put them, invisible regions decide what
belongs where, and an element can be marked as usable more than once.

**Nothing snaps.** An element is dragged wherever the learner wants and stays
exactly there, at the size the author gave it. Which region it turns out to be
on is worked out at marking time. The regions are never drawn and never in the
tab order — showing them would turn "where does this belong on the picture"
into "which box lights up".

Each region says how much of an element has to be on it, as `tolerance`:

| `tolerance` | Counts when |
| --- | --- |
| `touch` (default) | the element overlaps the region at all |
| `centre` | the element's middle is inside it |
| `fit` | the element is inside it completely |

`touch` is the default because it is what aiming at a target feels like; a rule
that refuses an element overlapping the right area by nine tenths teaches the
rule rather than the subject. The stricter two are for tasks where placing
precisely is the point. Where an element satisfies several regions at once —
easy under `touch` — the one it covers most wins, since that is the one the
learner was aiming at.

After checking, each moved element is marked in place: green where it belongs,
red where it does not, and outlined where it came to rest on no region at all.
Unless the whole task is worth a single mark, the element also carries what it
did to the score — `+1`, or `−1` where a wrong placement costs a point. The
sign carries the meaning, so it does not rely on the colour.

The answer is therefore a position per element, in fractions of the play area,
not a region id. Fractions rather than pixels so the same answer grades the
same on a phone and on a projector.

Scoring is H5P's. The maximum is one point per element that belongs somewhere,
or one per region for an element that can be reused. A wrong placement costs a
point when `applyPenalties` is on (the default, and effectively required once
elements are reusable — otherwise scattering everything everywhere scores full
marks), and the total is floored at zero. `singlePoint` makes the whole task
worth one mark, all or nothing. An element left on open ground is neither right
nor wrong.

Alternative text for the background is required. Each region carries a name
that is never shown to the learner — it is the author's handle on the canvas.

### Authoring

Drag on the picture to draw a region; drag a box to move it; drag its
bottom-right corner to resize. The numeric fields do the same thing and stay
for anyone without a pointer.

Regions and elements are listed collapsed, each one line: its name and what it
expects, or where it belongs. A task with a dozen regions is a dozen forms, and
all of them open at once is a wall. Touching one on the canvas — or drawing a
new one — opens its panel, since that is plainly the one being worked on.

### Accessibility

Because the regions are invisible, "choose an element, then choose a region" is
not a path anyone can take — there is nothing to choose. Keyboard users focus
an element and move it with the arrow keys (Shift for bigger steps, Backspace
to send it back), which is the same freedom a pointer has at the same
resolution. An element announces where it now is, as a percentage across and
down, and never which region it is over: that would tell a screen-reader user
something the picture tells nobody.

## Item pools

A pool hands each learner a random few of its steps. Twenty questions in the
file, five per learner, a different five each time.

```jsonc
{
  "meta": {
    "pools": [{ "id": "questions", "label": "Questions", "draw": 5 }]
  },
  "nodes": [
    { "id": "q1", "type": "task-choice", "pool": "questions", /* … */ },
    { "id": "q2", "type": "task-choice", "pool": "questions", /* … */ }
    // …
  ]
}
```

Members are ordinary nodes, wired into the graph in the usual way — chained in
a line is the common case. Drawing decides only which of them a given attempt
walks through; the rest are stepped over as though the graph did not contain
them, however many are chained together. Nothing about pools reaches the bits,
the condition language, or the report.

Membership lives on the node rather than the pool holding a list of ids, so
deleting a step cannot leave a pool pointing at something that is gone.

The draw happens once, when the attempt is created, and is recorded in the
snapshot as `pools`. Reloading resumes the same assessment rather than dealing
a new hand. An attempt that predates a pool has no draw recorded for it, and
every member stays visible — hiding steps from a learner on the strength of
missing data is the worse failure.

The progress bar counts the steps this learner will actually take, not the
twenty in the file. Cohort statistics already cope with learners who saw
different items, because branching does the same thing — see
[Reliability on a branching assessment](#reliability-on-a-branching-assessment).

The editor declares pools in the flow settings and assigns steps to them from
each step's own settings. Validation reports a pool with no members, one that
draws more steps than it has, one that draws all of them (it looks like it
varies and does not), a step naming a pool the flow does not declare, and a
pooled start or end.

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
