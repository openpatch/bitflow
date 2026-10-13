---
"@bitflow/web-component": patch
---

The progress line no longer freezes the page on long flows with hint loops. Working out "step 3 of about 12" walked every route through the flow, and each task with a hint that loops back for a second try doubled the routes — two dozen such tasks were sixteen million routes. Each step is now worked out once, so the same flow takes a few milliseconds.
