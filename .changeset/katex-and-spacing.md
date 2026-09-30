---
"@bitflow/web-component": minor
---

Maths in Markdown. Every field that takes Markdown now typesets TeX with KaTeX — `$…$` inline, `$$…$$` displayed — loaded only when a text contains maths, with its fonts bundled in the same lazy chunk.

A spacing and alignment pass over the tasks: hints, labels and empty-state notes no longer carry the browser's default margins on top of their layout gap; section labels render at text size instead of as large headings; grouped fields lose the browser's grooved fieldset border; column headings in the trace, truth and result tables line up whether or not they carry a note; the empty side of a Parsons puzzle is drawn as a drop area; and Markdown tables, headings and rules are styled.
