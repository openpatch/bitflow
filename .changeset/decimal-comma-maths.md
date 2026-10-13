---
"@bitflow/web-component": patch
---

`task-math` accepts a decimal comma. In a flow whose locale writes decimals with a comma (German, French, Dutch, Spanish, Italian, Portuguese, Turkish), the maths field types `1,5` as one number and its virtual keyboard shows a comma key. Marking reads `1{,}5` and `1.5` as the same number in every locale, so a learner may use either; a bare comma, as in `(1,2)`, still separates items.
