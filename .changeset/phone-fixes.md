---
"@bitflow/web-component": patch
---

Tasks work on a phone.

- Ordering and Parsons lines are dragged by a grip with a finger, so a swipe
  anywhere else on a line scrolls the step instead of being swallowed, and a
  Parsons line can now be reordered and indented on a touch screen at all. A
  drag held near the edge of the step or the page scrolls it. On a touch
  screen every placed Parsons line also has buttons to move it up and down and
  to indent and outdent it.
- An image annotation with point marks no longer traps a swipe that starts on
  the picture.
- The graph in a graph-path task keeps readable labels and tappable places on
  a narrow screen instead of shrinking with it.
- A numeric answer gets a ± key on touch screens, where the iPhone's decimal
  keypad has no minus; a hexadecimal answer gets a keyboard with letters; code,
  short answers and blanks are no longer capitalised or autocorrected.
- A long blank stays inside the screen, and the crossword's word boxes no
  longer make iOS zoom the page.
- Drag-and-drop labels scale with the picture and have a larger target on touch
  screens; highlighting spaces its words out for a finger; matching keeps the
  held card in view while the learner scrolls to its partner.
- Keyboard-speed and mouse-accuracy tell a touch-screen learner that their
  result will not be comparable. Nothing about the device is recorded.
- A host can reserve room at the end of the navigation bar for its own button
  with `--bitflow-controls-inset-end`, and a printed flow shows the whole step
  rather than the part scrolled into view.
