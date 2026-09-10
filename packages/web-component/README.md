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
| `lockedNodeIds` | `string[]` | Steps a host is holding shut. The learner may answer the step they are on but not move on from it. Looking back stays open. |
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
| `{ kind: "visits", nodeId }` | How many times a step has been shown. |
| `{ kind: "confidence", nodeId }` | How sure they said they were, `0`–`1`. |
| `{ kind: "timeSpent", nodeId? }` | Seconds on one step, or on the whole run. |
| `{ kind: "timeRemaining" }` | Seconds left on the assessment's own limit. |
| `{ kind: "resultCount", state, scope? }` | How many tasks ended in that outcome — `state` defaults to `"correct"`. |
| `{ kind: "score", scope? }` | Points earned so far. |
| `{ kind: "scoreRatio", scope? }` | Earned over possible, in `[0, 1]`. |

Compared with `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn` or `isTrue`,
and combined with `and`, `or` and `not`.

`confidence` and `timeRemaining` are *absent* rather than zero when there is
nothing to read — a step nobody was asked about, an assessment with no limit —
so a threshold on either is simply false instead of true for everybody. That is
also why `validate()` reports a confidence rule in a flow that never asks how
sure the learner is.

Confidence is the branch worth drawing that nothing else expresses: confident
and wrong is a misconception, unsure and wrong is a gap, and they need different
next steps.

```json
{
  "condition": {
    "type": "and",
    "conditions": [
      {
        "type": "compare",
        "left": { "kind": "result", "nodeId": "q3", "path": "state" },
        "op": "eq",
        "right": "wrong"
      },
      {
        "type": "compare",
        "left": { "kind": "confidence", "nodeId": "q3" },
        "op": "gte",
        "right": 0.8
      }
    ]
  }
}
```

Confidence runs `0`–`1`; the five points the learner is offered are `0.2`
through `1`, and the editor shows them as those five rather than as fractions.

### Counting over part of the assessment

`resultCount`, `score` and `scoreRatio` take an optional `scope`. Without one
they cover the whole run, which is what a final threshold wants; with one they
answer "did they pass *this section*" or "of the *last three*, how many".

| Scope | Covers |
| --- | --- |
| `{ kind: "section", id }` | Every step in that section. |
| `{ kind: "nodes", nodeIds }` | A hand-picked set. |
| `{ kind: "last", count }` | The most recently answered tasks, newest first. |

`last` counts back through the attempt's own history, so a step answered twice
counts once — it is the same task.

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
through dropdowns: an outcome, a yes/no answer, how many tasks, how much of the
marks, how sure they were, how many times a step has been shown, and the clock,
each with its scope where one applies. Anything more deeply nested, or an answer
buried at a dot path, is written in the `.bitflow` file and shown read-only
rather than rewritten.

On the canvas a connection carries its own rule in short — `answered No`,
`≥ 3 correct of last 5`, `≥ 80% in Reading` — so a step with four branches out
of it is readable without clicking each one. An author who wants different
wording sets the connection's own name, which wins.

### What the editor checks

`validate()` reports the ways a branch can be written so that it never fires,
which otherwise fail silently — the flow still runs and the teacher never finds
out. It flags a threshold higher than the number of tasks before the
connection, a rule reading a task the learner cannot have reached yet, a node
that is not a task, an outcome that does not exist, an ordering comparison
against something that is not a number, a membership test without a list, and
an empty rule set.

## Going back round: a connection that resets

An edge may carry `resetTarget`, which says what arriving over it clears on the
step it lands on.

| `resetTarget` | Clears |
| --- | --- |
| absent | Nothing. They see the step as they left it. |
| `"result"` | The marking. What they wrote stays, to be corrected. |
| `"answer"` | The marking and the answer. |

This is what makes a remediation loop work. Draw
`question → (wrong) → explanation → question` without it and the learner lands
back on their old answer, already marked wrong, with a Next button and no way to
change anything: the loop is drawable, and does nothing.

`"result"` is the usual choice — it is the bargain Try again already makes.
`"answer"` is for a task that *measures* something, a timed run or a typing
speed, whose recorded figure has to be taken again rather than edited.

The try count is never cleared. It is the record of how many goes the task took,
and a loop that erased it would report someone who went round three times as
having answered first time.

## Sections

A section is a run of steps that belong together and share something: the
passage five comprehension questions are about, the listing three trace
questions step through, the table the sums come from.

```json
{
  "meta": {
    "sections": [
      { "id": "reading", "label": "Reading", "markdown": "It was a bright…" }
    ]
  },
  "nodes": [{ "id": "q1", "type": "task-choice", "section": "reading" }]
}
```

The markdown is rendered above every step in the section, the label shows under
the progress bar, and the section is a `scope` a branch can count over. Before
this the passage had to be pasted into all five questions, because a content
step shows its text once and is gone.

Membership lives on the node, like pool membership and for the same reason: a
list of ids on the section would go stale the moment a step was deleted. A start
or an end cannot be in one.

## How freely a learner may move

`meta.navigation`:

| Setting | What it does |
| --- | --- |
| `"linear"` | Forwards only. An exam. |
| `"back"` | They may step back through what they have seen. The default. |
| `"free"` | They may jump to any step already visited, from a list. |

The list `free` renders is also the check-your-work screen: it marks which steps
are tasks with no answer yet. Jumping is backwards only at every setting —
which step comes next depends on answers not yet given, so there is nothing
truthful to jump forward to.

Going back re-runs every branch on the way forward again, in all three modes. An
answer changed on the second pass has to be able to send them somewhere else.

`meta.allowSkip` decides whether a task may be passed on without answering. A
single task overrides it from its own grading settings — for the one question
everyone has to attempt.

## Shuffling a pool

A pool draws a few of its members for each learner. With `"shuffle": true` it
also decides the order they arrive in, so drawing *all* of them is how you give
everyone the same questions in a different sequence — which is what most people
mean by a randomised test, and which could not be expressed at all before.

```json
{ "id": "bank", "label": "Questions", "draw": 10, "shuffle": true }
```

A shuffled pool navigates by the order the attempt drew rather than by its
internal wiring, so it needs one step leading in and one leading out.
`validate()` says so when more than one member leads out of it, or none does.
Members are still ordinary nodes chained together as usual; the chain is what
the author draws, and the draw is what the learner walks.

## A step that has to be done

A bit may declare `isComplete`, and while it returns `false` the runtime will
not let the learner move on. It is for steps that are not graded but still have
to be *done* — agreeing to take part, saying who you are.

The runtime only disables Next. Saying what is missing is the step's job, and
both bits that use this render the reason above the button and before it in
reading order, so it arrives before the dead control rather than after it.

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

## The opening screen

`<bitflow-start-simple>` is a title and a message. With `showOutline` on it also
says what is ahead: roughly how many questions, the time limit, and whether they
can go back.

Those three are worked out from the assessment itself, so they cannot go stale
the way "this test has 12 questions" does the moment a thirteenth is added. The
count is approximate on purpose — branching means not every learner meets every
task — and a pool contributes what it draws rather than what it holds.

## Consent

`<bitflow-start-consent>` says what the assessment records and will not let the
learner start until they have answered either way. It is the step that tells the
learner about the things the measurement tasks keep — see
[Pointing accuracy](#pointing-accuracy) and [Typing](#typing) for exactly what
those are, and what they deliberately do not store.

With `allowDecline` on — the default — the choice is a radio group and declining
is a complete answer, so a connection can route it somewhere else:

```json
{
  "source": "consent",
  "target": "practice-instead",
  "condition": {
    "type": "compare",
    "left": { "kind": "answer", "nodeId": "consent" },
    "op": "eq",
    "right": false
  }
}
```

Consent that cannot be refused is not consent. With `allowDecline` off the
control becomes a single tick box, there is one way on, and the text above it
should say so.

The answer is a bare `boolean` — `true` for yes — rather than an object, so the
branch above needs no dot path and the editor can offer it as an ordinary rule:
*the learner's answer to this step is No*. `task-yes-no` stores its answer the
same way, and the same rule works for it.

### Accessibility

Radio group when there are two answers, a single checkbox when there is one —
a lone unticked box does not say which answer silence means. Every option is a
whole clickable line at least 44px tall. While nothing is chosen the step says
why Next will not move, above the button and before it in reading order.

## Who you are

`<bitflow-start-identify>` asks the learner for a name, a pseudonym, a class —
whatever the author lists — before anything is graded, so a report or a
certificate has something to label a row with. Without it that label has to come
from the surrounding application.

Each field is `{ id, label, hint, required, kind, options }`. `kind: "select"`
is for answers that come from a fixed set: free text turns twenty people in one
class into three different spellings, and nothing lines up afterwards. A field
with no label is never shown, and never required — a blank box nobody can answer
would be a dead end.

The answer is a map of field id to what they entered. **It is stored in the
attempt in the clear**, like every other answer, so ask for as little as the job
needs; a first name or a pseudonym is usually enough to hand work back.

The first field that gets an answer is what `<bitflow-end-certificate>` prints
as the learner's name, so put that one first.

### Accessibility

Every control has a real `<label>` tied to it by `for`, hints are rendered
underneath the question they belong to, and required fields say so in the label
rather than only in colour. While a required answer is missing the step says so
above the Next button.

## Hand back to the host

`<bitflow-end-handoff>` returns the finished attempt to the page around it.
bitflow has no server, so for an embedded assessment this is the moment the
result leaves the tab — and the learner is told what happened to it, because if
it went nowhere, that tab is the only place their work exists.

```json
{
  "type": "end-handoff",
  "data": {
    "postMessage": true,
    "messageOrigin": "https://school.example",
    "continueUrl": "https://school.example/next"
  }
}
```

The host receives `{ type: "bitflow:attempt", attempt }` on `window.parent`.

`messageOrigin` must be an exact `scheme://host[:port]`. **`*` is rejected
outright**: a wildcard target hands a learner's whole attempt — every answer,
every explanation they typed — to whatever page happens to have framed this one,
and the browser warns nobody. Anything carrying a path is a typo, and a typo
here has to fail loudly rather than deliver somewhere unintended; the authoring
form says so next to the field.

It posts once per attempt, not once per render. Nothing framing the page at all
is caught before the post rather than after: `window.parent` is then the page
itself, so posting would deliver here and report success, and the learner is
told instead that their work has not gone anywhere.

What the learner is told is "sent", not "arrived". `postMessage` is one-way and
there is no acknowledgement to wait for — a target origin that does not match
the page on the other side is discarded silently, with nothing thrown and
nothing returned — so the wording says the work was sent to the surrounding page
and to speak up if nothing follows. The failure state covers what does throw,
and offers another go.

`continueUrl` is an ordinary link they choose to follow, never a redirect: being
moved off the page that says whether your work was saved is not something to do
to somebody. It is drawn only when it is a `http`/`https` or relative address —
a document comes from wherever `src` points, and `javascript:` in an `href`
would run in the page holding the attempt, which is exactly what `Markdown`
already refuses for a link written in prose. The authoring form says so on the
field.

## Certificate

`<bitflow-end-certificate>` is a printable closing sheet: heading, message,
name, score, date and who set the assessment. Everything on it comes out of the
run, so nothing is typed twice and nothing can disagree with what happened.

The name is taken from a `start-identify` step in the same flow — its first
answered field. Nothing is shown if the assessment never asked. The print button
is outside the certificate and hidden by `@media print`, because a sheet with
"Print this" printed on it is not a certificate.

## Save a copy

`<bitflow-end-download>` hands the learner their own attempt as a JSON file,
saved on their device with nothing sent anywhere. It is the export a *learner*
can perform: no account, no network, works in a room with no internet.

With `includeAnswers` on, the file is a complete record that can be restored
into the flow and re-marked in a browser. With it off, the answers go — and the
written reasoning goes with them, because an explanation in someone's own words
gives away at least as much as the answer it explains. Confidence stays; it is a
number about a task.

If the browser refuses to save, the step says so out loud. This may be the only
copy of the work there is, so a silent failure is the one outcome that must not
happen.

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

## Parsons puzzle

`<bitflow-task-parsons>` gives the learner the lines of a program, shuffled,
and asks for the program back: which lines belong, in what order, and — when
the author asks for it — how deeply each one is nested. Lines that belong
nowhere are part of the exercise, since deciding what to leave out is most of
what reading code is.

Scored the way js-parsons scores it: a point per line in the right place, a
second per line nested correctly when indentation is part of the answer, and,
if the author turns it on, a point off for each line that should have been left
behind. Order and indentation are counted separately, so "right steps, wrong
nesting" is a partial mark and a specific piece of feedback rather than a zero.

The bank is shuffled from the attempt, and never into the answer's own order.
Code is rendered as text and never executed — a `.bitflow` file can come from
anywhere, and running what it contains is not a thing this needs to do.

It is authored as a program: one box holding the finished code, one holding the
lines that belong nowhere. Nesting is read off the code, so two-space,
four-space and tabbed programs all mean the same thing — the narrowest indent
that occurs is one step — and the form says back what level each line came out
at, which is the half of the answer a stray space is easiest to lose.

### Accessibility

Every move is a drag and a keystroke, neither one the poor relation. A line is
dragged from the bank into the program and dropped where it goes, dragged back
to the bank to take it out, and dragged rightwards to nest it — how far right
it is dropped is how far in it is, which is the gesture js-parsons established
and the one the nesting actually looks like. The same three things are choosing
a line, moving it with the arrow keys, indenting with left and right, and
Backspace.

Whether a gesture counts as a drag is measured from where it began rather than
from the last position the pointer reported. A slow drag moves a pixel at a
time, and against the previous position it never counts at all: it ends as a
click, which here takes the line straight back out.

## Crossword

`<bitflow-task-crossword>` follows H5P's Crossword, with one deliberate
difference. H5P lays the grid out in the learner's browser every time the
content is opened, so the same words can come out differently for two learners
and an author cannot see what they are setting. Here the layout is worked out
once, while authoring, and written into the file — the same kind of generator,
run at the other end. A `.bitflow` file then describes exactly one puzzle,
which is what makes it reviewable, printable and gradeable.

The author writes answers and clues; the grid is derived from them. The
generator starts from one answer and hangs the rest off letters already down,
settling every choice by rule rather than by a coin toss: the same words always
come out the same way, whatever order they were typed in. It tries each answer
as the starting one and keeps the best grid, and comes back to a word that
would not fit until more letters were on the board. A word it cannot place is
reported by name rather than dropped, and parked clear of the grid so the
author is not told their words overlap when the truth is that one does not fit.

Scoring is H5P's. By word — the default, and how a crossword is actually solved
— an answer is right or it is not. By letter, every correct square counts,
which is kinder to a long answer with one slip in it. A wrong letter can cost a
point; an empty square never does, so a learner who guesses at the last clue
never finishes behind one who left it blank.

The schema refuses a grid that cannot be solved: two words wanting different
letters where they cross, one word written along the length of another, and a
word that cannot be reached from the rest — which is a list of clues wearing a
crossword's clothes.

### Accessibility

The grid behaves the way a newspaper crossword behaves: click a square to start
typing, click it again to turn the corner, and the word you are in is lit so
you can see what you are answering. Typing moves along the word and Backspace
walks back through it; the arrow keys move, and a perpendicular one turns the
corner rather than jumping to a blank square.

The grid is one tab stop, not one per square, so Tab can leave it — a crossword
that swallows Tab is a trap for anyone driving it from a keyboard. Moving
between clues is done from the clue list, where every clue is also a text field
of exactly the right length wired to the same squares. That is not a fallback:
it is how this is answered with a screen reader, on a phone, or by anyone who
would rather read the clue and type the word than hunt for the square.

Each square is announced with where it is and both clues it answers, so the
crossing squares — the ones that make a crossword a crossword — say what they
belong to.

## Find the words

`<bitflow-task-word-search>` follows H5P's Find the Words: a letter grid with
words hidden in it, a point for each one found, and nothing taken away for a
drag that finds nothing — dragging across the grid is how the question is
*read*, not only how it is answered, and charging for looking would make the
task about caution rather than about finding.

As with the crossword, the grid is built once while authoring rather than in
the learner's browser each time. The author writes the words, ticks which of
the eight runs are allowed, and the grid is generated and written into the
file. Everything is settled by rule or by a seeded generator, so the same
words in any order always produce the same puzzle — and the same puzzle for
every learner.

The filler letters are rolled again whenever they would spell one of the
hidden words somewhere it was not put. That coincidence is rare and it is
poisonous: a learner who finds the accidental one is right, would be marked
wrong, and has nothing to learn from it. It is also the reason a find is
judged on where it was drawn rather than on what the letters spell, which in
turn lets two words share letters and lets the same word be hidden twice.

Either way along a word counts. Reading it backwards is the same discovery;
asking people to guess which end the author started at is not part of the
exercise.

### Accessibility

Drawing along a word and naming its two ends are the same two decisions, so
the pointer and the keyboard share one operation. With a pointer: press on the
first letter and pull to the last, and the run snaps to the eight directions a
word can run — a word search is a game of straight lines, and a drag two
squares across and one down plainly means the horizontal one. With a keyboard:
the arrow keys move, Enter marks the first letter, Enter marks the last, and
Escape abandons the run.

The grid is one tab stop rather than one per square, with the cursor moved
inside it, so Tab can still leave it. Every find is announced with what was
found and how many remain, and a found word is struck through in the list as
well as tinted in the grid.

## Numbers

`<bitflow-task-numeric>` takes a number, or a short calculation that comes to
one, and marks it arithmetically rather than textually. `0.75`, `.75`, `3/4`
and `75e-2` are one answer. Whether `3.14159` counts as pi is a tolerance the
author sets, not a question of how many characters happen to match — which is
the difference between this and `<bitflow-task-input>` with a pattern.

Five ways to say how close is close enough: exactly, within a fixed amount,
within a percentage, equal to so many decimal places, or equal to so many
significant figures. The authoring form prints the range the setting actually
accepts — "anything from 98 to 102" — because a tolerance is two numbers away
from meaning anything, and an author who cannot see the range is guessing.

Where the mark depends on precision, the learner is told what precision is
wanted. Rounding to three figures when nobody said three is a trick, not a
question.

### Arithmetic, and nothing else

The grammar is hand-parsed, in about two hundred lines: the four operations,
powers, brackets, a named list of functions, and `pi`, `e` and `tau`. There is
no `eval`, no `Function`, no `RegExp` built from learner text and no request to
anywhere. The point is not that dangerous things are blocked — it is that the
grammar has no way to *name* a global, a property or a call target, so they
cannot be written down. `alert(1)` is not refused as a threat; it is refused
because `alert` is not one of the seventeen functions and the expression
therefore ends before the bracket.

A sign binds looser than a power, so `-2^2` is −4, the way it is on paper.
`2^3^2` is 512. Division by zero and the square root of a negative are "that
does not work out to a number" rather than a mark against `Infinity`.

An author may write the expected value as an expression too — `2*pi*0.35` beats
pasting in a rounded decimal and then widening the tolerance to cover the
rounding. The learner can be held to a plain number where the question is
"give it as a decimal": `3/4` is then refused rather than quietly worked out,
which is the whole point of asking.

### Decimal points and units

A comma is read as a decimal point by default, because that is what a learner
taught in German or French will type. A thousands separator is never accepted
in any mode: `1,500` cannot mean one and a half and fifteen hundred at once,
and a task that silently picks one of those readings is worse than one that
says it did not understand.

The unit is either absent, printed beside the box, or asked for. Printed, the
learner need not type it and is not punished for typing it anyway; asked for,
it has to be right, and it can be worth its own mark — `9.81 m/s` has the
arithmetic right and the physics wrong, and scoring that as nothing says the
arithmetic was wrong too. Spacing, superscripts and the several multiplication
signs are folded away, so `N m`, `N·m` and `Nm` are one unit and `m/s²` matches
`m/s^2`. Capitals are not folded: `mm` and `Mm` differ by a factor of a
billion.

### The reading is shown

This is the one task type where the thing marked is not the thing typed, so the
task says what it made of the box as the box is filled in: type `3/4` and it
reads back `0.75`. A learner who is told that can tell the difference between
getting the arithmetic wrong and writing something the task could not read. It
is a polite live region, and it stays quiet when the reading is simply the text
back again — a region that speaks on every keystroke is worse than one that
waits until it has something to add.

The answer holds the raw text and nothing else. The number it comes to and the
unit it carries are derived, and derived is where they stay: a stored copy is a
second version of the truth that can disagree with the box after a reload. The
reading the score was worked out from travels with the result instead, which is
the pair — what was typed, and what it was taken to mean — that makes a
disputed mark settleable.

### Accessibility

An ordinary text box with an ordinary label, so it is reached, filled in and
corrected however the learner reaches, fills in and corrects anything else. It
is `type="text"` rather than `type="number"`: a spinner cannot express `2*pi`,
and `type="number"` empties itself on the `1.5e` a learner is halfway through
typing. `inputMode` still brings up the numeric keypad on a phone where no
calculation is allowed.

The unit beside the box is tied to it with `aria-describedby`, so it is heard
and not only seen, and so is the note about precision.

## Maths

`<bitflow-task-math>` asks for an *expression* — a fraction, a power, a radical,
a factorised quadratic — written as maths in a [MathLive](https://mathlive.io)
field, and compares it as maths. `2x`, `x\cdot 2` and `2\times x` are one
answer. That is not a list of spellings anybody maintained; it falls out of
comparing what the two expressions mean.

Writing it as maths is half the point. A fraction typed into a text box is
`(a+b)/(c+d)`, and a fraction written as a fraction is a fraction — only one of
those is the notation being taught.

### Two shapes, one task

The author writes a LaTeX template, and what is in it decides the shape:

- **No `\placeholder`** — one editable field, and one answer. "Differentiate
  x², give the derivative."
- **One or more `\placeholder[name]{}`** — the formula is printed read-only and
  the gaps are editable, each marked on its own. "Complete the identity
  (a+b)² = ▢ + 2ab + ▢."

They are one bit because they are one question with a different number of
blanks in it: the answer is `{ prompts: { name: latex } }` either way, with the
single case under the reserved name `answer`, and partial credit falls out for
free. A five-blank question is still worth one mark, so `evaluation.weight`
stays the only place a task's worth is decided.

This is not the same thing as `<bitflow-task-fill-in-the-blank>`, which is
prose with gaps matched as text. This is one formula with gaps matched as
maths, and merging them would put two rendering engines and two matching
regimes in one bit.

### Three ways to be right

Which one is chosen changes what the question *is*, so they are named for the
question rather than the algorithm:

| Setting | `(2x-1)(x+1)` vs `2x²+x-1` | `½` vs `0.5` | For |
| --- | --- | --- | --- |
| The same expression | ✗ | ✓ | "Factorise it", "differentiate it" |
| Anything equal to it | ✓ | ✓ | "Give an expression equal to this" |
| It comes to the same number | — | ✓ | "How much is it" |

"Anything equal to it" is the wrong choice for "factorise it", where it would
accept the question back unchanged as its own answer — which is why the
authoring form says so under the setting rather than leaving it to be
discovered.

Comparison is done by Cortex's [Compute Engine](https://cortexjs.io), which
parses LaTeX into MathJSON and reasons over that. It is a library doing
algebra, not a sandbox running learner input: `parse` builds a data structure
and the comparison walks it. Nothing is executed and nothing is fetched — the
whole decision is made in the browser from two strings, so an attempt can be
re-marked from a snapshot with no network at all.

### It loads when it is needed

MathLive is 823 kB and the algebra engine is larger still. The schema and the
marking are what a flow needs in order to *run*; the editor is what it needs in
order to be *answered*, and only on the step that asks. Both are loaded on
demand, so an assessment that happens to contain one maths question does not
put a megabyte in front of the other twenty.

The KaTeX fonts are inlined into the bit's stylesheet as data URIs rather than
fetched from a `fontsDirectory`. That is the one asset a consumer would
otherwise have to remember to deploy, and forgetting it does not fail loudly —
it renders integrals and radicals in whatever serif the browser has.

### When it does not load

A chunk that fails to arrive is an ordinary Tuesday, and this bit is the one
with the most to fail. When MathLive is not there the learner gets a labelled
text box per answer and types LaTeX into it. That is not a consolation prize:
a mathfield's value *is* LaTeX, so an answer typed there is the answer the
marking expects, byte for byte. Anyone who knows the notation is not blocked,
and everyone else is told why rather than shown an empty rectangle.

### Accessibility

`setPromptState` marks a blank by tinting it, which is colour and a border. The
same thing is therefore said in words in a live region — how many were right,
and which blank was which — because colour alone is not a result a screen
reader can read or a colour-blind learner can trust.

The on-screen maths keyboard is offered by default; it is how the task is
answerable on a phone at all. It can be turned off for the questions where a
physical keyboard is part of what is being asked.

## Pointing accuracy

`<bitflow-task-mouse-accuracy>` shows targets one at a time and records, for
each, where the click landed, whether it hit, and how long it took. There is no
H5P equivalent; it follows the pointing literature instead, and exists as much
for teaching about human-computer interaction as for practice — the per-round
detail carries the distance moved, the width of the target and Fitts's index of
difficulty, which is what you need to plot time against difficulty and find the
straight line.

Scoring is a point per target hit, and — if the author asks for speed as well —
a second for each hit made inside an allowance. Kept apart so partial credit
means something: someone who hit every target but took their time has done the
accurate half of the task, and one number for both would say otherwise.

### It is a task about using a pointing device

That is not something to paper over. The task says so before it starts, in
those words, rather than letting someone find out by failing at it. Where the
author allows it — the default — the learner can stand down instead, and the
result is `unknown`: worth nothing out of nothing, so it neither rewards them
nor drags their total down. That is what `notApplicable` means in a system
whose scores are ratios, and it is the only honest way to count a task somebody
could not attempt.

There is deliberately no keyboard route to the targets. One would measure
nothing at all, and offering it would disguise which question is being asked.
The start and stand-down buttons are ordinary buttons, and the result is
reported as a table of rounds rather than only as marks on a picture.

"Try again" starts the run over rather than handing the task back with nothing
left to click. Retrying clears the result and keeps the answer, which is right
for an answer that is a draft to be corrected and wrong for one that is the
record of a finished run — five rounds already recorded leave nothing to do.
Any task that measures a run rather than collecting a response has to treat a
retry this way.

### What an answer contains

Where each click landed inside the task's own area, as a fraction of it;
whether it hit; and the elapsed milliseconds from a monotonic clock. Nothing
else. No window or screen coordinates, no pointer type, no device or input
trace — the task measures a person's aim, and has no business describing their
hardware.

## Typing

`<bitflow-task-keyboard-speed>` shows a passage and a box, and marks every
character of the passage as it is passed — right, wrong, or not yet reached.
Seeing the mistake where it happened is most of what makes typing practice
practice rather than testing.

The measurements are the ordinary ones: characters in the right place, accuracy
against whichever of the two texts is longer, and net words per minute at the
conventional five characters to a word. Accuracy is measured against the longer
text so that stopping half way does not look perfect for as far as it went, and
typing half a page of extra counts against it too.

A mark for accuracy, and — if the author asks — a second for speed. Kept apart,
and accuracy first, because they are not the same skill and accuracy is the
half everybody can be asked for. Speed is never the only mark: a task scored on
words per minute alone would fail a careful typist and pass a fast, wrong one.
Words per minute is net of errors, so it cannot be gamed by typing nonsense
quickly.

The clock runs from the first character to the last, and the figure on screen
is the one the score uses. A separate live timer ticking past the last
keystroke would show a learner one number and mark them on another.

### It is a task about using a keyboard

The text is read from the input's value on change, never from key events. That
is what makes it work with an input method editor, where several keystrokes
compose one character and the keystrokes are not the text — and it is also why
there is no key-by-key record to keep: the component never has one. An answer
holds the finished text and one elapsed figure. Nothing listens outside the
box.

Timing can be switched off entirely, which leaves accuracy. Someone who types
accurately with one finger, a switch or a head pointer is not typing badly, and
a clock on the screen says otherwise. Switching timing off also takes the
scoring back to accuracy rather than leaving a speed mark nobody can earn.

Where the author allows it — the default — the learner can stand down, and the
result is `unknown`: worth nothing out of nothing, so it neither rewards them
nor drags their total down.

## Code trace

`<bitflow-task-code-trace>` shows a program and asks what it does: a trace
table with a row per moment and a column per thing being watched.

**The code is never executed.** Not by `eval`, not by `Function`, not by a
runner somewhere else. What makes the task gradable is that the author writes
the states down as well as the code, so marking is a comparison against
authored data rather than a language implementation this package would have to
be trusted with. The listing is text, and the language is named for the reader
only — nothing here parses or highlights it.

A column watches one of three things, which is why "predict the variables",
"predict the output" and "predict which line runs next" are one bit rather
than three: a value, the output *so far* (cumulative down the table, the way
output is traced by hand), or the next line to run — chosen from the listing
rather than typed, so the learner picks a line instead of remembering a number.

Cells are compared as values, not as strings. `6`, `6.0` and `+6` are one
answer; `[1, 2]` and `[1,2]` are one answer; `True` and `true` are one answer
unless the author says capitals matter. A cell the author left blank means
"there is nothing here yet" — a real part of a trace, which has to be left
blank for the table to be right, but not a mark to be earned, or a table of
undefined variables would pay a learner for answering none of it.

The answer key is authored in the learner's own table. The columns and the
checkpoints are declared a row each — a heading and a kind, a name and a line —
and then the expected values are typed into the very grid the class will fill
in, through the same component. The author reads down a column the way a trace
is checked, and the two views cannot drift apart because there is only one.

### Accessibility

The table is a real `<table>` with row and column headers, and every control
carries its own label — "total, after the loop" — because a header association
is not a label everywhere. The line numbers are text rather than a CSS marker,
so they are read out with the line: a question about which line runs next is
unanswerable if you cannot tell which line you are hearing. Every input is a
native text box or a `<select>`, so there is nothing here that a pointer can
do and a keyboard cannot.

## Graph path

`<bitflow-task-graph-path>` draws a graph and asks for something out of it: a
route, the cheapest route, the order a breadth- or depth-first search visits
places in, a cheapest spanning tree, or a cheapest cut.

All five are one bit because they are one answer — a set or a sequence of node
and edge ids — and because they are marked the same way. Dijkstra, the two
searches, Kruskal and a max-flow all run in the page over the authored graph,
so the *cost* of the best answer is computed rather than stored. That is what
lets an equally good alternative be right without the author having thought of
it, which is the whole difficulty with these questions on paper.

What is wrong with an answer is said in words — "that route works, but there
is a cheaper one", "those connections go round in a circle", "the order goes
wrong part of the way through". Each is a statement about what the learner
chose, so none of it gives the answer away.

A traversal states its tie-break rule as part of the question, because without
one it has several right orders: neighbours are taken alphabetically, or in
the order the connections were drawn. Only a traversal is scored out of
anything but one — a point per place named in the right order before it goes
wrong. A route that does not arrive is not two-thirds of a route.

Places are stored as fractions of the diagram, never pixels, and the authoring
form lets them be dragged about or typed in as percentages.

### Accessibility

The diagram is a picture, and never the only place the graph exists: it is
written out underneath — "A joins B (1), C (4)" — for every reader, and the
answer is built from real controls rather than from the picture. Buttons add a
place to a route, checkboxes tick a connection into a tree or a place onto the
near side of a cut, and clicking the diagram does exactly what those do and
nothing more. Every change is announced in a live region, and a connection is
hit through an invisible wide line, because nobody can be asked to click a
three-pixel stroke.

## Number representation

`<bitflow-task-number-representation>` gives a value and asks for it again
another way: decimal, binary, octal, hexadecimal, or text taken character by
character as ASCII or Unicode.

The width and the signedness belong to the *value* rather than to either
representation — "an eight-bit signed integer" is what a thing is, and decimal
and binary are two ways of writing it down. That is why there is one of each
setting rather than one per side, and it is what makes the interesting
question expressible at all: 214 and −42 are the same eight bits.

It is marked arithmetically. `2A`, `2a` and `0x2A` are one answer, and no list
of accepted spellings is kept anywhere. A minus sign is refused where the sign
is the top bit, because writing `-101010` for an eight-bit pattern is the
mistake the question is usually about — refusing it says so, rather than
quietly understanding it. The grammar is hand-parsed and deliberately narrow:
no `eval`, no `Function`, and no `parseInt`, which reads `12nonsense` as twelve
and `0x10` as sixteen wherever it is handed one. Values are `bigint`, so a
64-bit pattern is exact.

A space separates one value from the next and an underscore only groups the
digits of one, so `0100_1000` cannot mean two things at once. The author may
require the leading zeros, in which case the answer can also be marked digit by
digit — the two strings line up position for position, and "the third bit is
wrong" means something. An item is worth the same whether or not the answer
could be read at all.

The answer is the raw text alone; what it comes to is derived, and shown back
as the learner types, since this is a task type where the thing marked is not
the thing typed.

### Accessibility

One labelled text box, monospaced and letter-spaced so a run of digits can be
read position by position. What the task makes of what was typed is announced
in a live region as it changes, and what the answer has to look like — the
number of digits, which prefixes are accepted, whether spaces are allowed — is
said in the hint under the label rather than discovered by being marked wrong.

## Written answer

`<bitflow-task-free-text>` collects a few sentences and refuses to pretend it
understood them.

**Who marks it is the whole of the bit.** Under *a person, later* the task
scores `unknown` — nothing out of nothing — the text travels whole in the
attempt for whoever is going to read it, and the learner is told so before they
start writing. That is the only honest setting for an open question, and it is
the default. Under *words to look for*, each rubric line looks for its words
and the learner is told that is what happened: the wording says *mentioned*,
never *correct*, because a good answer in other words scores zero and saying
otherwise would be a lie about what a browser can do.

Words are matched whole, so "sort" is not met by "assortment" and "or" is not
met by every second sentence. Any one of a line's words counts — they are
spellings of one idea, not a list of requirements — and a line with a space in
it is looked for as a phrase. The matching walks the answer's own words rather
than building a `RegExp` out of author text, so an author's stray bracket
cannot become an exception in a learner's browser.

The rubric is shown before the answer is written as well as after it is marked:
knowing what is being looked for is part of the question, not a reward for
finishing. A shortest length is a count on the screen and never a gate — a
learner who said it in fewer words has not done anything wrong — while a
longest length is enforced by the box, since a limit that silently accepts more
is not a limit.

### Accessibility

One labelled text box with the count tied to it through `aria-describedby`, in
a polite live region so it is available on demand rather than read out a
keystroke at a time. Each rubric line carries its outcome as text beside the
label as well as in the tick and the border, and a line that was not mentioned
is drawn as unfinished rather than as a mistake — nothing read the answer, and
it may well have been said in other words.

## Truth table

`<bitflow-task-boolean-logic>` asks for a truth table, worked out row by row.

**There is no stored answer key.** The author writes an expression; the rows
are generated from the variables and every cell is worked out by walking the
tree. That is what makes it reliable — a table cannot disagree with the heading
above it, because the table *is* the heading. Renaming a variable or fixing a
bracket rewrites every cell at once, and there is nothing left over to go
stale.

The expression is stored as a tree and typed as text. The parser is
hand-written over a grammar with variables, five connectives, two constants and
brackets, in the same spirit as the numbers task: no `eval`, no `Function`, no
`RegExp` built from author text, and no way to *name* a global, a property or a
call target. `alert(1)` is not blocked, it is unsayable. Every ordinary
spelling works — `AND`, `&&`, `∧`, `*`; `->`, `=>`, `→` — and precedence is the
textbook order, so an expression copied out of one means what it meant there.
The form reads the expression back with only the brackets that carry meaning,
which is the only way to see that `A ∨ B ∧ C` was understood the way it was
written.

A column can be marked as given: shown worked out rather than asked for, and
never scored. A table that builds up to something is taught by handing over the
early columns.

### Accessibility

A real `<table>` with row and column headers, and every control labelled with
both — "A ∧ ¬B, when A is true and B is false" — because a header association
is not a label everywhere. Each cell is a `<select>` with three states rather
than a checkbox with two: a learner who has not reached a row must not look
like one who answered false, and an unfinished cell is drawn as unfinished
rather than as a mistake.

## Mark the picture

`<bitflow-task-image-annotation>` hands the learner the picture and asks them
to mark it. The difference from *find the spot* is who chooses the position:
there the author draws the regions and the learner picks one, here the learner
decides where the thing is. "Which of these is the nucleus" and "mark the
nucleus" are different questions, and the second cannot be answered by
elimination.

The accepted regions are never drawn until the answer is in. A point is judged
by whether it lands inside; a box the learner draws is judged against a box the
author drew by how much they share as a fraction of everything they cover
between them — so an outline round the whole picture does not count as an
outline round one thing. A box against a spot is taken by its middle, since
"outline it" and "mark the spot" are not the same question.

Each region takes at most one mark and each mark answers at most one region, so
covering the picture cannot collect every point. A mark in the right place
under the wrong name is reported as exactly that rather than as a miss. Stray
marks cost nothing by default: placing the right marks is already what is
rewarded, and charging for a stray one makes the task about caution.

### Accessibility

Placing a mark is one decision — where — and a keyboard makes it exactly as
well as a pointer, so there is no fallback path here. A crosshair the arrow
keys move and Enter places; a box is Enter for one corner and Enter for the
other, which is the two decisions a drag makes, made one at a time, with Escape
to start over. Shift moves further per press.

Under the picture, every mark is a row saying where it is in per cent, what it
is called, and how it was judged — which is not a courtesy, it is the only way
anybody removes or renames one, and it is how the answer reads back as words.
What was missed is named there too, since an outline on a picture cannot say it
to everybody.

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
