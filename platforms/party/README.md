# bitflow-party

The server half of a live session: a host points a session at a `.bitflow`
**URL**, gets a code, students join and work through it at their own pace, and
the host watches a live board of who is where and how they are doing. The host
can also **lock** individual steps — a student who reaches a locked step
answers it but cannot move on until the host unlocks it.

This package runs on [PartyKit](https://partykit.io). It is private and is
never published.

## What the server stores

Results, never content. The room holds a flow URL, a lock list, and one
stripped report per participant. The document — every embedded image, every
correct answer, every word of stimulus text — never reaches PartyKit.
Students fetch the flow themselves from the URL, the same way
`<bitflow-flow src>` already does.

Answers never reach the host either. The student's page builds a report and
drops the `answer` from each node report before it goes anywhere. The
protocol declares the node report with `z.strictObject`, so a frame carrying
an `answer` key is rejected by the schema itself — a modified client cannot
push answers to the host even deliberately.

And results never reach the class. A participant row carries a name, a
position and a stripped report, so it only ever goes out as a `toHosts`
effect — never a broadcast. What every connection does receive is the
`session` frame, which carries the flow and the lock list and nothing about
anybody. A page that simply does not draw the board is no protection: a
broadcast would put every learner's marks in every learner's browser.

## Layout

```
src/
├── protocol.ts   zod schemas + types (exported as "./protocol")
├── room.ts       pure reducer — all the logic
├── room.test.ts
└── server.ts     thin Party.Server shell
```

The room logic is a pure `applyMessage(state, from, message) => { state,
effects }` function, so it is testable without a worker — `room.test.ts` is
the first server-side test in the repo.

`protocol.ts` is the shared module `platforms/web` imports, via
`"exports": { "./protocol": "./src/protocol.ts" }`. Source-only on purpose:
both consumers are bundlers, and a `dist` step here would buy nothing.

## Commands

```sh
pnpm --filter bitflow-party dev      # partykit dev, localhost:1999
pnpm --filter bitflow-party test     # the room reducer (vitest, node)
pnpm --filter bitflow-party run deploy   # partykit deploy → *.partykit.dev
```

## Known limits

- **Self-reported progress.** Grading is in the learner's page; the board
  shows what their browser claims. Fine for a classroom, not for anything
  graded.
- **The flow URL must stay reachable, and CORS-readable, for the whole
  session.** This is the trade for not uploading the document. It also means
  the flow can change under a running session — the `flowId` /
  `flowSchemaVersion` check turns that into a visible rejection rather than a
  silently wrong board.
- **A shuffled pool draws per student.** Each participant gets their own draw,
  so "everyone is on question 3" does not mean everyone is on the same
  question. `computeGroupStatistics` already handles a branched cohort
  honestly — it restricts Cronbach's alpha to the items everyone reached and
  reports how many that was.
- **Locks are per step, not per student.** A step is open or shut for the room.
- **No authentication.** Anyone with the code can join under any name. That is
  the right trade for a classroom and the wrong one for anything else. The one
  thing that is not handed out on request is the *host* role: the first host
  claims the room, and a later `hello` claiming it is refused. A self-declared
  second host could set the flow, which clears every student row and the
  results with it. A host who drops keeps the claim — the row survives as
  disconnected, and reconnecting sends the same participant id.
