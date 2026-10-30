---
"bitflow-studio": patch
---

Bitflow Studio takes its fonts and colour scheme from the workbench. A webview is its own document, so nothing of VS Code's typography reached the editor by inheritance: the canvas sat in the browser default serif and stayed light in a dark workbench. The editor now reads `--vscode-font-family` and `--vscode-editor-font-family`, and a dark workbench sets `color-scheme: dark`, which is what the `light-dark()` theme resolves against.
