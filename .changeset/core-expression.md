---
"@bitflow/core": minor
---

`parseExpression` and `parseQuantity` — the small, hand-parsed arithmetic
language task-numeric reads answers with — are exported from core, with
optional named variables (`{ variables: { x: 2 } }`) and, when there are any,
multiplication by juxtaposition (`3x`). Nothing is ever passed to `eval` or
`Function`; a name nobody gave a value is not arithmetic.
