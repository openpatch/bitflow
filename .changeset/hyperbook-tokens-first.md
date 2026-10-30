---
"@bitflow/core": minor
---

bitflow now reads four of Hyperbook's design tokens where the host declares them — `--color-brand`, `--color-background`, `--color-text`, `--color-text-deactivated` — with bitflow's own palette as the fallback. A flow on a Hyperbook page (and the editor in a frame of Hyperbook Cloud) follows the book's brand, background and text in both themes without a mapping stylesheet, the way learningmap does. A host that declares the bitflow tokens itself still wins outright; and a Hyperbook still owes the container a `color-scheme`, without which the `light-dark()` feedback colours stay light in a dark book.
