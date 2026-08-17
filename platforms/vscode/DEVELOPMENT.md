# Developing Bitflow Studio

## Running it

```sh
pnpm install
pnpm build                       # the workspace packages the webview bundles
pnpm --filter bitflow-studio watch
```

Then press <kbd>F5</kbd> in VS Code to open an Extension Development Host, and
open `example.bitflow` in it.

The webview is one esbuild bundle, so a change to any workspace package needs
that package rebuilt (`pnpm build`) before `watch` picks it up.

## How the two halves fit together

`src/extension.ts` and `src/BitflowEditorProvider.ts` run in the extension host,
under Node. `src/webview.tsx` runs in the webview, which is a browser. They talk
over `postMessage`:

| Message | Direction | Meaning |
| --- | --- | --- |
| `ready` | webview → host | Mounted; send me the document. |
| `update` | host → webview | The document changed; here is its text. |
| `edit` | webview → host | An authoring change, debounced by 250 ms. |
| `save` | webview → host | The editor's Save button; write and save the file. |
| `flush` | host → webview | A save is pending; send whatever you are holding. |
| `flushed` | webview → host | Here it is. |
| `togglePreview` | host → webview | Switch between authoring and taking it. |

The `TextDocument` is the single source of truth. The provider tracks the exact
text it last wrote and ignores that one change event, so its own edits do not
bounce back and reset the canvas.

## Manual checks before releasing

1. Open `example.bitflow`: the visual editor appears.
2. Change something: the tab goes dirty, and undo works in VS Code.
3. <kbd>Ctrl</kbd>+<kbd>S</kbd> immediately after a keystroke: the file contains
   that keystroke, not the state from before it.
4. Edit the file as source (**Bitflow: Show Source**): the editor follows along.
5. **Bitflow: Preview as a Learner**: the assessment runs. Answer something,
   leave preview, and check that nothing was written to the file.
