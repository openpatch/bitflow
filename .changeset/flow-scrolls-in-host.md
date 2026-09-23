---
"@bitflow/web-component": patch
---

`<bitflow-flow>` fits the box its host gives it instead of clipping whatever
does not fit — the result page in a fixed-height box lost its bottom half. The
progress bar stays at the top and the buttons at the bottom, in a compact bar
under a divider; only the step between them scrolls. With a fixed `height` the
flow fills it; with only a `max-height` it grows with the step up to the cap;
with neither it grows with the step. Moving to a new step scrolls back to the
top, and the step no longer draws a focus ring round itself when it takes
focus on arrival.
