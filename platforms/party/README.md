# bitflow-party

The server half of a live session: a host points a session at a `.bitflow`
**URL**, gets a code, students join and work through it at their own pace, and
the host watches a live board of who is where and how they are doing. The host
can also **lock** individual steps — a student who reaches a locked step
answers it but cannot move on until the host unlocks it.

This package is a [PartyServer](https://github.com/cloudflare/partykit) room — a
Durable Object with a Worker in front of it — running on **your own Cloudflare
account**, not on a hosted `*.partykit.dev`. It is private and is never
published to npm.

## What the server stores

Results, never content, and not for long. The room holds a flow URL, a lock
list, and one stripped report per participant, and deletes all of it two hours
after the last frame — see [Expiry](#expiry). The document — every embedded image, every
correct answer, every word of stimulus text — never reaches the server.
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
└── server.ts     thin Durable Object shell + the Worker that routes to it
wrangler.jsonc    the binding, the migration, the dev port
```

The room logic is a pure `applyMessage(state, from, message) => { state,
effects }` function, so it is testable without a worker — `room.test.ts` is
the first server-side test in the repo.

`protocol.ts` is the shared module `platforms/web` imports, via
`"exports": { "./protocol": "./src/protocol.ts" }`. Source-only on purpose:
both consumers are bundlers, and a `dist` step here would buy nothing.

## Commands

```sh
pnpm --filter bitflow-party dev      # wrangler dev, localhost:1999
pnpm --filter bitflow-party test     # the room reducer (vitest, node)
pnpm --filter bitflow-party types    # regenerate worker-configuration.d.ts
pnpm --filter bitflow-party lint     # types, then tsc --noEmit
pnpm --filter bitflow-party deploy   # wrangler deploy → your own account
```

`worker-configuration.d.ts` is generated from `wrangler.jsonc` and gitignored —
fifteen thousand lines of runtime types is not source. `lint` and `build`
regenerate it first, so a fresh clone type-checks without a separate step.

## Running it yourself

The server is an ordinary Worker plus one SQLite-backed Durable Object, so
deploying it is `wrangler deploy` against an account you own. No PartyKit
account, no `*.partykit.dev`.

Nothing deploys it automatically. This repo deploys one thing — the static
gallery — and the host and join pages are left out of that build, so a session
is something you stand up yourself.

1. **Authorise.** `pnpm exec wrangler login` on a laptop, or set
   `CLOUDFLARE_ACCOUNT_ID` and a `CLOUDFLARE_API_TOKEN` with the *Edit
   Cloudflare Workers* permissions. The second form is what a CI job would use.
2. **Deploy.** `pnpm --filter bitflow-party deploy`. It prints the host the
   Worker answers on: `bitflow-party.<subdomain>.workers.dev`, or whatever
   custom domain you route to it.
3. **Point the pages at it.** `VITE_PARTY_HOST` is the host `platforms/web`
   opens a socket to, read at build time — and `host.html`/`join.html` have to
   go back into `vite.config.ts`'s inputs for that build to contain them at
   all; CLAUDE.md lists the edits. With `VITE_PARTY_HOST` unset the pages look
   for `localhost:1999`, which is where `wrangler dev` listens, so a local
   session needs no configuration at all.

SQLite-backed Durable Objects are available on the Workers free plan, with
lower limits; a paid plan lifts them. One room is one Durable Object, named by
the six-character code — so a session costs nothing until somebody joins it.

### The route

`routePartykitRequest` maps `/parties/:party/:room` onto a Durable Object
binding, kebab-casing the binding name: the `Session` binding in
`wrangler.jsonc` serves `/parties/session/<room code>`, which is why
`platforms/web/src/session.ts` passes `party: "session"` to `PartySocket`.
PartyServer has no default party, so renaming the binding silently breaks every
client until the constant moves with it.

### Hibernation

`static options = { hibernate: true }` — a class of thirty sockets is mostly
silence, and billing that as wall-clock time is the easy way to make a free
classroom tool expensive. What makes it safe is that nothing lives in a field
that matters: the room is in storage and reloaded by `onStart`, and the
participant id behind a socket is on the socket, via `connection.setState`,
which PartyServer writes to the WebSocket attachment. A map in memory would not
survive the nap.

### Expiry

A room deletes itself `ROOM_TTL_MS` — two hours — after its last frame. The
flow, the locks and every participant row go; the alarm is pushed forward on
each message, so the clock runs from when the room went quiet, not from when it
was made, and a double lesson is not wiped halfway through.

This is about retention rather than storage. A room holds a class's worth of
names against marks, at a few hundred kilobytes; nothing else in this platform
ever removes them, so without an expiry they would sit in a Durable Object for
as long as the account does. Anyone still connected is sent an `error` frame
saying the session has expired and then dropped — both pages already render
one, and a bare close would leave a student's next answer refused with "your
flow does not match this session", which is true and useless.

The host claim goes with the rows, so an expired code can be hosted again.

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
