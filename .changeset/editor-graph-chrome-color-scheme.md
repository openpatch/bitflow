---
"@bitflow/bitflow": patch
"@bitflow/web-component": patch
---

The editor's graph chrome — React Flow's zoom buttons, minimap, dotted background and edges — follows the `color-scheme` of the container now, the same one bitflow's own `light-dark()` palette resolves against. Before, React Flow's `colorMode` stayed `light` whatever the host, so a dark editor (a book in the dark theme, Hyperbook Cloud's editor frame, a dark VS Code workbench) had light chrome on its dark canvas.
