---
"@bitflow/shell": patch
---

Fix: Error when attempting to play a sound file which is not available. This
bug has existed because new Audio(url).play() returns a promise, therefore the
error, which was thrown was not caught. Now we are catching the error.
