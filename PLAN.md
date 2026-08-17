# bitflow: Web Component Rewrite Plan

This plan is written to be executed by **any AI coding agent**, regardless
of vendor/model. It describes a complete rewrite of bitflow (currently a
React component monorepo) into a project structured and tooled like its
sibling `../java-memory-playground`: React internally, exposed as **web
components**, with a **VS Code extension** for authoring `.bitflow` files.

No backward compatibility is required. The JSON schema, package
boundaries, state management, and build tooling may all be redesigned.

## Problem Statement

bitflow is a flow-based assessment library with two major surfaces:

- **Flow** — renders and runs an assessment defined in a JSON file for a
  learner ("take the assessment").
- **Flow Editor** — a node-graph UI for authoring/editing that assessment
  JSON ("author a new flow").

Today both are React component libraries (`@bitflow/flow`,
`@bitflow/flow-editor`) consumed directly by React apps (see
`examples/nextjs-client-side-assessment`). The goal is to make bitflow
consumable as framework-agnostic **web components**
(`<bitflow-flow>`, `<bitflow-flow-editor>`), and to ship a **VS Code
extension** that provides a custom editor for `.bitflow` files, following
the exact patterns already established in `java-memory-playground`.

## Confirmed Decisions (from clarification)

1. **Web component strategy**: Keep React internally; expose via
   `@r2wc/react-to-web-component`, exactly like
   `@java-memory-playground/web-component`. No vanilla/Lit rewrite.
2. **Package granularity**: Consolidate the "infrastructure" packages
   (`core`, `flow`, `flow-editor`, `flow-engine`, `flow-node`, `provider`,
   `shell`) into a single core React package. **Bit/task types stay as
   individual packages** (one per task type) so consumers only ship the
   bits their `.bitflow` file actually uses.
3. **Lazy bit loading**: The main web component inspects the loaded
   `.bitflow` JSON, determines which bit `type`s are actually referenced,
   and `import()`s only those bit packages at runtime. Each bit package
   self-registers into a shared bit registry when its module loads. Bundlers
   (Vite/esbuild) code-split on the dynamic `import()` boundary, so unused
   bits are never downloaded.
4. **Bit scope**: Port all 9 existing bit types: `start-simple`,
   `end-tries`, `task-choice`, `task-yes-no`, `task-input`,
   `task-fill-in-the-blank`, `task-highlighting`, `title-simple`,
   `input-markdown`.
5. **Schema**: Redesign the `.bitflow` JSON data model from scratch (clean
   slate, no migration needed). Each bit package owns and exports its own
   zod schema for its `data` payload; the core envelope schema only
   validates the generic node/edge/graph shape and defers `data` validation
   to the resolved bit's schema.
6. **Flow-graph library**: `@xyflow/react` (successor to
   `react-flow-renderer` v9), matching java-memory-playground.
7. **State management**: `zustand` + `zundo` (undo/redo) +
   `fast-deep-equal`, replacing the current React Context + `immer`
   approach, matching java-memory-playground's store pattern.
8. **i18n**: Keep multi-language support (de, fr, nl, es, it, pt, tr,
   en) but replace `@vocab/*` (Next.js-coupled build tool) with a
   lightweight runtime i18n: plain JSON message catalogs per package +
   a small `translate(key, locale, vars)` helper. No compile step.
9. **Repo layout**: Mirror java-memory-playground exactly:
   `packages/*` for libraries, `platforms/vscode` for the VS Code
   extension, `platforms/web` for a hosted demo/playground site
   (replacing today's `examples/` + `website/`).
10. **VS Code extension scope**: Custom editor for `.bitflow` with the
    document-as-source-of-truth pattern (same message-passing protocol as
    `java-memory-playground-studio`), **plus** a preview/"take assessment"
    mode to test-run the flow as a learner would, toggled the same way jmp
    toggles source/diagram view.
11. **Every bit is independently usable as its own web component.** Each
    bit package ships its own custom element (e.g. `<bitflow-task-choice>`,
    `<bitflow-task-yes-no>`) that works standalone in any HTML page —
    passed its `data` config and emitting standard DOM events (e.g.
    `answer`, `evaluate`) — not just as a node rendered inside `<bitflow-flow>`.
    `<bitflow-flow>` / `<bitflow-flow-editor>` compose these same
    per-bit custom elements internally rather than duplicating rendering
    logic; the lazy-loading resolver (decision 3) becomes "define the
    custom element for each used bit type", which is the same operation a
    standalone consumer performs manually via one `<script>`/`import`.
12. **Keep the implementation simple.** Prefer the smallest number of
    moving parts that satisfies the above: minimize abstraction layers,
    avoid speculative extensibility hooks, avoid introducing a plugin
    system beyond the one bit registry, and prefer plain functions/data
    over class hierarchies or dependency-injection frameworks. Every
    package should be small enough to read end-to-end in one sitting.
    Concretely: no more indirection than needed for decisions 2, 3, and 11.

## Simplicity Principle

This rewrite is judged as much on **how little code it takes** as on
feature completeness. When implementing, Opus should actively default to
the simplest option at every fork:

- One shared bit registry + one lazy-loading resolver, reused by both
  `<bitflow-flow>` and each bit's standalone custom element — do not build
  two different loading mechanisms.
- No extra plugin/middleware layers "for future flexibility" — add
  abstraction only when a second concrete use case demands it.
- Prefer plain objects/functions over classes; prefer composition over
  inheritance.
- Flat file structure per package (avoid deep nested folders) unless a
  package genuinely outgrows it.
- Reuse the same theme CSS custom properties (see below) everywhere rather
  than inventing per-package styling systems.
- If a to-do below can be done with fewer files/packages without hurting
  the "each bit is a standalone web component" and "lazy loading" goals,
  prefer the simpler shape.

## Target Package Layout

```
packages/
  bitflow-core/         # pure TS: envelope schema, flow-engine (next/previous/
                         # collect/distance), do-condition evaluator, bit
                         # registry, i18n helper, shared types — NO React
  bitflow/               # React: <Flow> (learner) + <FlowEditor> (author),
                         # @xyflow/react graph canvas, zustand+zundo store,
                         # Shell/Progress/Confidence UI, uses bitflow-core;
                         # composes bit custom elements from bits/* rather
                         # than duplicating their rendering
  bits/
    start-simple/
    end-tries/
    task-choice/
    task-yes-no/
    task-input/
    task-fill-in-the-blank/
    task-highlighting/
    title-simple/
    input-markdown/
    # each: React Task/Evaluation/Feedback components + zod schema,
    # self-registers into bitflow-core's bit registry on import, AND
    # r2wc-wraps itself as a standalone custom element
    # (e.g. <bitflow-task-choice>) usable on its own, independent of Flow
  web-component/         # @bitflow/web-component: r2wc-wraps <Flow> and
                         # <FlowEditor> as <bitflow-flow> / <bitflow-flow-editor>,
                         # implements the shared lazy bit-loading resolver
                         # (also reused by each bit's own custom element)
platforms/
  vscode/                # bitflow-studio: custom editor for *.bitflow
  web/                   # demo/playground site (Vite), replaces website/ + examples/
```

Removed/merged: `@bitflow/core`, `@bitflow/flow`, `@bitflow/flow-editor`,
`@bitflow/flow-engine`, `@bitflow/flow-node`, `@bitflow/provider`,
`@bitflow/shell`, `@bitflow/bits` (barrel), `examples/`, `website/`.

## Data Model (new, in `bitflow-core`)

- `.bitflow` file = JSON: `{ version, meta, nodes: BitNode[], edges: BitEdge[] }`
- `BitNode`: `{ id, type, position, data }` — `data` shape is owned by the
  bit package for `type`; core only validates the envelope.
- `BitEdge`: `{ id, source, target, sourceHandle?, targetHandle?, condition? }`
  — conditions ("do" logic) evaluated by `bitflow-core`'s engine, independent
  of any specific bit.
- Bit registry: `registerBit(type, { schema, Task, Evaluation?, Feedback?,
  Statistic?, evaluate? })`. `bitflow-core` exports `getBit(type)` /
  `hasBit(type)` used by both the React layer and the web-component resolver.

## Lazy Bit Loading (shared resolver, reused everywhere)

There is exactly **one** loading mechanism, used both by `<bitflow-flow>`
and by a standalone bit custom element:

1. Each bit package, on module load, calls `registerBit(type, {...})` (data
   registration) **and** `customElements.define('bitflow-<type>', ...)`
   (its standalone element) — both happen in the same module, so importing
   a bit package is the one action that makes it fully usable, either
   embedded in a flow or standalone in any HTML page.
2. `<bitflow-flow src="...">` (from `web-component`) receives/loads the
   `.bitflow` JSON, scans `nodes[].type` for distinct types, and resolves
   each against a static `import()` map (e.g. `{ "task-choice": () =>
   import("@bitflow/task-choice"), ... }`) built at build time so bundlers
   code-split per bit.
3. Await all needed imports, show a lightweight loading state meanwhile,
   then mount/render — `<bitflow-flow>` internally just uses the now-defined
   `<bitflow-task-choice>` etc. custom elements as its node renderers,
   passing them the node's `data`.
4. A consumer who only wants one task type standalone (e.g. embedding a
   single `<bitflow-task-choice>` on a plain web page, no flow at all)
   simply imports `@bitflow/task-choice` directly — the exact same
   self-registration runs, no separate "standalone mode" code path needed.
5. `<bitflow-flow-editor>` eagerly imports all 9 bit packages up front (an
   author needs the full palette) — it is the only place that skips the
   lazy step, but it still reuses the same registry/custom-elements.

## VS Code Extension (`platforms/vscode`)

Mirror `java-memory-playground-studio`'s architecture doc 1:1:
- `extension.ts` + `BitflowEditorProvider.ts` (Node, extension host):
  registers `bitflow.editor` custom editor for `*.bitflow`, owns the
  `TextDocument`, commands `bitflow.new`, `bitflow.showSource`,
  `bitflow.showEditor`, **`bitflow.showPreview`** (new: toggles into
  learner "take assessment" mode using `<bitflow-flow>` instead of
  `<bitflow-flow-editor>`, non-persisted/ephemeral state).
- `webview.tsx` (browser): mounts `<bitflow-flow-editor>` (or
  `<bitflow-flow>` in preview mode), same message protocol as jmp
  (`ready` / `edit`+content / `save`+content / `flushed` / `update` / `flush`),
  debounced edits, `onWillSaveTextDocument` flush-on-save.
- Document remains the single source of truth; own writes are ignored via
  the same "last written text" guard.
- Reuse `scripts/build-vscode.mjs`-style bundling (extension for Node,
  webview for browser, one inlined stylesheet + script per CSP rules).

## Tooling Changes

- Build: Vite (lib mode) per package, replacing custom `scripts/build.mjs`
  esbuild scripts — matches java-memory-playground.
- Tests: `vitest`, replacing `jest`.
- Package manager/workspace: keep `pnpm` + `pnpm-workspace.yaml` +
  `changesets` for versioning/releases.
- Forms: re-evaluate `react-hook-form` usage per-bit as each bit is ported;
  keep it where it simplifies validation, drop where zustand state suffices.
- Styling: drop `@openpatch/patches` and `@emotion/*` entirely. Replace with
  plain CSS (CSS custom properties + plain `.css`/CSS-module files per
  package), matching java-memory-playground's approach. See "Design
  System / Theming" below for how the old patches-based look is preserved
  without the library.

## Design System / Theming (replacing `@openpatch/patches`)

Today's bitflow depends on `@openpatch/patches` (an Emotion-based
component/theme library: `Theme`, `Box`, `Alert`, `AutoGrid`, `Heading`,
`Checkbox`, `Input`, `HookFormController`, etc.) for both its visual theme
tokens (colors, radii, shadows, font sizes/weights) and its UI primitives.
This is being **removed entirely**, along with `@emotion/*`. Replacement
approach:

- **Theme tokens as plain CSS custom properties**, defined once in
  `bitflow-core` (or a tiny `bitflow`-level `theme.css`) and imported by
  every package, e.g.:
  - `--bitflow-color-primary: #007864;` (OpenPatch Green, from
    `../branding/colors/openpatch.gpl`)
  - `--bitflow-color-primary-dark: #004c45;` (Deep Forest)
  - `--bitflow-color-primary-light: #b5e3d8;` (Fresh Mint)
  - `--bitflow-color-neutral-900: #242428;` (Coal)
  - `--bitflow-color-neutral-700: #3c3c3c;` (Charcoal)
  - `--bitflow-color-neutral-400: #a4a4a4;` (Quicksilver)
  - `--bitflow-color-neutral-200: #d6d6d6;` (Silver Charlice)
  - `--bitflow-color-neutral-100: #f5f5f5;` (Whitesmoke)
  - `--bitflow-color-black: #000000;` / `--bitflow-color-white: #ffffff;`
  - `--bitflow-font-family: "Montserrat", sans-serif;` (per branding
    typography guidance)
  - `--bitflow-radius-small/standard/full`, `--bitflow-shadow-standard`,
    `--bitflow-shadow-outline`, `--bitflow-font-size-standard/large`,
    `--bitflow-font-weight-bold` — reconstructed to match the visual feel
    the old `theme.radii`/`theme.shadows`/`theme.fontSizes` tokens produced
    (rounded corners on nodes/handles, soft standard shadow, bold outline
    shadow for focus/selection), without needing patches' exact values.
  - Since `Web Components` use Shadow DOM by default, these custom
    properties must be defined on `:root` **and** re-declared/inherited
    into each component's shadow root (custom properties pierce shadow
    boundaries automatically in CSS, so a single `:root` definition is
    sufficient — just ensure the web-component wrapper doesn't reset them).
- **UI primitives become plain HTML + CSS classes** instead of patches
  components: `Box` → `<div>`/CSS, `Alert` → a small local `Alert`
  component styled with plain CSS using the theme variables, `Heading` →
  semantic `<h1>`-`<h6>` + CSS, `Checkbox`/`Input` → native `<input>` styled
  via CSS + kept wired to `react-hook-form` where still used, `AutoGrid` →
  CSS Grid utility class, `HookFormController` → replaced by direct
  `react-hook-form` `register`/`Controller` usage (no wrapper needed).
- **`@bitflow/flow`'s `Styles.tsx` global overrides** (react-flow node/edge/
  handle/minimap styling) get ported as plain global CSS using the new
  `--bitflow-*` custom properties in place of `theme.radii.*` /
  `theme.colors.*` / `theme.shadows.*` / `theme.fontSizes.*` /
  `theme.fontWeights.*`, preserving the exact same visual rules (rounded
  node corners, bordered handles, outline shadow on selection, bold edge
  labels with white stroke, etc.) — i.e. a 1:1 visual port, just off plain
  CSS instead of Emotion + patches theme.
- **Logos/icons**: continue referencing `../branding/logos` assets (bitflow
  plain/circle marks) for extension icon, favicon, README, per existing
  convention — no change there.
- Net effect: bitflow keeps its recognizable OpenPatch-green, rounded,
  soft-shadow "feel", but with zero `@openpatch/patches` or `@emotion`
  dependency anywhere in the new packages.

## Out of Scope / Explicitly Not Doing

- No backward compatibility with existing bitflow `.json` assessment files
  or package APIs.
- No vanilla/Lit rewrite — React stays as the implementation detail behind
  the web-component boundary.
- `@openpatch/patches` and `@emotion/*`: removed entirely, replaced by
  plain CSS + CSS custom properties as described above (not carried
  forward even as an optional/peer dependency).

## Open Items for Opus to Decide During Implementation

- Exact zod schema shape per bit (design fresh, informed by current
  `bitsSchema.ts`/`flowSchema.ts` for feature parity, not structure).
- Whether `bitflow-core` and `bitflow` should be split as described, or
  merged further if the boundary proves artificial once code is written.
- Naming details of exported custom element tag names and package npm
  names (`@bitflow/...` scope should be kept).
- CI/workflow files (`.github/workflows`) should be updated to the new
  package layout, mirroring java-memory-playground's changeset-based
  release flow.

## Todos

Execute in this order (later items depend on earlier ones being done first,
as noted). Each todo should be tracked to completion before moving on.

- [ ] **0. Commit this plan into the repo** (`commit-plan`)
  - Copy this file to `PLAN.md` at the bitflow repo root (already done once
    plan mode is exited) and commit it, so the plan travels with the repo
    for whichever AI/session picks up the implementation.

- [ ] **1. Scaffold new repo layout and tooling** (`scaffold-repo-layout`)
  - Create `packages/` and `platforms/` directories mirroring
    `java-memory-playground`'s top-level layout.
  - Set up the pnpm workspace (`pnpm-workspace.yaml`), Vite in library mode
    per package (replacing `scripts/build.mjs` esbuild scripts), `vitest`
    (replacing `jest`), and keep `changesets` for versioning/releases.
  - Remove the old packages entirely: `core`, `flow`, `flow-editor`,
    `flow-engine`, `flow-node`, `provider`, `shell`, the `bits` barrel
    package, `examples/`, and `website/`.
  - No dependency: this is the first step.

- [ ] **2. Define the shared plain-CSS theme** (`design-theme`) — depends on 1
  - Create `--bitflow-*` CSS custom properties sourced from
    `../branding/colors/openpatch.gpl` and `../branding/README.md`:
    - `--bitflow-color-primary: #007864;` (OpenPatch Green)
    - `--bitflow-color-primary-dark: #004c45;` (Deep Forest)
    - `--bitflow-color-primary-light: #b5e3d8;` (Fresh Mint)
    - `--bitflow-color-neutral-900: #242428;` (Coal)
    - `--bitflow-color-neutral-700: #3c3c3c;` (Charcoal)
    - `--bitflow-color-neutral-400: #a4a4a4;` (Quicksilver)
    - `--bitflow-color-neutral-200: #d6d6d6;` (Silver Charlice)
    - `--bitflow-color-neutral-100: #f5f5f5;` (Whitesmoke)
    - `--bitflow-color-black: #000000;` / `--bitflow-color-white: #ffffff;`
    - `--bitflow-font-family: "Montserrat", sans-serif;`
    - Reconstructed `--bitflow-radius-small/standard/full`,
      `--bitflow-shadow-standard`, `--bitflow-shadow-outline`,
      `--bitflow-font-size-standard/large`, `--bitflow-font-weight-bold` to
      match the old `@openpatch/patches` theme's visual feel (rounded
      corners, soft shadows, bold outline on selection/focus).
  - Define these on `:root` in a shared stylesheet exported from
    `bitflow-core` (or a `bitflow`-level `theme.css`); verify custom
    properties pierce Shadow DOM boundaries correctly for the eventual
    web components.
  - Build plain-CSS/plain-HTML replacements for the patches primitives
    actually used today: `Box`→`<div>`+CSS, `Alert`→small local component,
    `Heading`→semantic `<h1>`-`<h6>`+CSS, `Checkbox`/`Input`→native
    `<input>` styled via CSS (wired to `react-hook-form` where still
    needed), `AutoGrid`→CSS Grid utility class, `HookFormController`→direct
    `react-hook-form` `register`/`Controller` usage.
  - Port `@bitflow/flow`'s `Styles.tsx` global react-flow overrides
    (node/edge/handle/minimap styling) to plain global CSS using the new
    `--bitflow-*` variables — a 1:1 visual port of the existing rules.
  - Confirm no `@openpatch/patches` or `@emotion/*` dependency remains
    anywhere in the new packages.

- [ ] **3. Build `bitflow-core` package** (`build-bitflow-core`) — depends on 1
  - Pure TypeScript, no React, no patches/emotion.
  - New `.bitflow` envelope schema: `{ version, meta, nodes: BitNode[],
    edges: BitEdge[] }`, `BitNode { id, type, position, data }`,
    `BitEdge { id, source, target, sourceHandle?, targetHandle?,
    condition? }`. Core validates only the envelope; each bit package owns
    its own `data` schema.
  - Port the flow-engine logic (`next`/`previous`/`collect`/`distance`)
    and the do-condition evaluator from the current `flow-engine`/`do.ts`.
  - Implement the bit registry: `registerBit(type, { schema, Task,
    Evaluation?, Feedback?, Statistic?, evaluate? })`, `getBit(type)`,
    `hasBit(type)`.
  - Implement the lightweight i18n helper: plain JSON message catalogs per
    package + a small `translate(key, locale, vars)` function, no build-time
    compiler (replacing `@vocab/*`). Cover existing locales: en, de, fr,
    nl, es, it, pt, tr.

- [ ] **4. Build the `bitflow` React package** (`build-bitflow-react`) —
  depends on 2, 3
  - State management: `zustand` + `zundo` (undo/redo) + `fast-deep-equal`,
    replacing the current React Context + `immer` approach.
  - `<Flow>` (learner-facing, runs an assessment) and `<FlowEditor>`
    (author-facing, node-graph editor) components.
  - Node-graph canvas via `@xyflow/react` (replacing `react-flow-renderer`
    v9).
  - Port `Shell`/`Progress`/`ConfidenceLevels` UI, styled with the new
    plain-CSS theme from step 2 — no patches/emotion.

- [ ] **5. Port all 9 bit/task-type packages, each a standalone web
  component** (`port-bit-packages`) — depends on 2, 3
  - One package each: `start-simple`, `end-tries`, `task-choice`,
    `task-yes-no`, `task-input`, `task-fill-in-the-blank`,
    `task-highlighting`, `title-simple`, `input-markdown`.
  - Each: fresh zod schema for its `data` payload, React
    Task/Evaluation/Feedback components restyled with plain CSS.
  - Each package's entry module, on import, does two things together (keep
    it to one small file, no separate "adapter" package): (a)
    `registerBit(type, {...})` into the shared `bitflow-core` registry, and
    (b) `customElements.define('bitflow-<type>', ...)` via
    `@r2wc/react-to-web-component`, so the bit is immediately usable both
    as a `<bitflow-flow>` node **and** dropped standalone into any HTML
    page (e.g. `<bitflow-task-choice data='...'></bitflow-task-choice>`
    with zero flow/editor involved).
  - This is what enables the shared lazy-loading resolver in step 6 — do
    not build a second, separate mechanism for "standalone mode".
  - No `@openpatch/patches` dependency in any bit package.

- [ ] **6. Build the `web-component` package** (`build-web-component`) —
  depends on 4, 5
  - Wrap `<Flow>` and `<FlowEditor>` with `@r2wc/react-to-web-component` as
    `<bitflow-flow>` and `<bitflow-flow-editor>` custom elements. Internally
    they render/compose the same per-bit custom elements from step 5 (e.g.
    `<bitflow-task-choice>`) as node renderers — do not reimplement bit
    rendering here.
  - Implement the one shared lazy bit-loading resolver, used by
    `<bitflow-flow>`: scan the loaded `.bitflow` JSON for distinct
    `nodes[].type` values, resolve each against a static `import()` map
    (e.g. `{ "task-choice": () => import("@bitflow/task-choice"), ... }`)
    so bundlers code-split per bit, await all needed imports (each
    self-registers per step 5), show a loading state, then mount.
  - `<bitflow-flow-editor>` eagerly imports all 9 bit packages (an author
    needs the full palette) — no lazy loading there, but it's the same
    registry/custom-elements, just imported up front instead of resolved
    dynamically.

- [ ] **7. Build `platforms/vscode` extension** (`build-vscode-extension`)
  — depends on 6
  - Mirror `java-memory-playground-studio`'s architecture: `extension.ts`
    + `BitflowEditorProvider.ts` (Node/extension host) registering a
    `bitflow.editor` custom editor for `*.bitflow`, owning the
    `TextDocument` as the single source of truth (ignore own writes via a
    "last written text" guard).
  - `webview.tsx` (browser) mounts `<bitflow-flow-editor>` (or
    `<bitflow-flow>` in preview mode), using the same message protocol as
    jmp: `ready` / `edit`+content / `save`+content / `flushed` / `update` /
    `flush`, debounced edits, `onWillSaveTextDocument` flush-on-save.
  - Commands: `bitflow.new`, `bitflow.showSource`, `bitflow.showEditor`,
    and **`bitflow.showPreview`** (new: toggles into learner "take
    assessment" mode using `<bitflow-flow>`, ephemeral/non-persisted
    state).
  - Reuse `../branding/logos` bitflow marks for the extension icon.
  - Adapt `scripts/build-vscode.mjs`-style bundling (extension for Node,
    webview for browser, one inlined stylesheet + script per CSP rules).

- [ ] **8. Build `platforms/web` demo site** (`build-web-platform`) —
  depends on 6
  - Vite-based demo/playground site replacing `website/` + `examples/`.
  - Showcase embedding `<bitflow-flow>` and `<bitflow-flow-editor>` as
    plain web components in a framework-agnostic page, **and** a separate
    example embedding a single bit standalone (e.g. just
    `<bitflow-task-choice>` with no flow/editor at all) to demonstrate
    decision 11.

- [ ] **9. Update CI, README, changesets config** (`update-ci-docs`) —
  depends on 7, 8
  - Update the root `README.md`, `.github/workflows/*`, and changesets
    config for the new package layout and release flow.

- [ ] **10. End-to-end verification** (`e2e-verification`) — depends on 9
  - Author a sample `.bitflow` file in `<bitflow-flow-editor>`.
  - Take it in `<bitflow-flow>` preview mode.
  - Confirm lazy-loaded bits only fetch the task-type packages actually
    used in the sample file (verify via network/devtools code-split
    chunks).
  - Visually confirm the theme matches the old bitflow branding/feel
    (OpenPatch green, rounded corners, soft shadows, Montserrat type).

## How to Use This Plan

This file (`PLAN.md` at the bitflow repo root) is the single source of
truth for tracking progress — it is self-contained and does not depend on
any external tool, session, or database. Any agent (regardless of vendor)
picking up this work should:

1. Read this whole file before starting.
2. Work through the numbered todos in order (each notes its dependencies).
3. Check off `- [ ]` → `- [x]` as each todo is completed, and commit that
   change together with the corresponding code.
4. If a decision in "Confirmed Decisions" turns out to be unworkable during
   implementation, update this file to record the change and why, rather
   than silently deviating.
5. Treat "Simplicity Principle" as a tiebreaker whenever a design choice
   isn't already dictated by a decision above.
