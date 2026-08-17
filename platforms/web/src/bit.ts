// One import. It registers the bit and defines <bitflow-task-choice>; there is
// no separate "standalone mode" to opt into.
import "@bitflow/task-choice";

const task = document.querySelector("bitflow-task-choice") as HTMLElement & {
  data: unknown;
};
const log = document.querySelector("#log")!;

const note = (message: string) => {
  log.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${log.textContent}`;
};

task.data = {
  instruction: "Which of these are **prime** numbers?",
  variant: "multiple",
  choices: [
    { id: "c-2", markdown: "2", correct: true },
    {
      id: "c-9",
      markdown: "9",
      correct: false,
      feedbackWhenChecked: { message: "9 is 3 × 3.", severity: "info" },
    },
    { id: "c-13", markdown: "13", correct: true },
    { id: "c-21", markdown: "21", correct: false },
  ],
  shuffle: false,
  partialCredit: true,
  evaluation: { mode: "auto", enableRetry: true, showFeedback: true },
  patternFeedback: [],
};

task.addEventListener("bitflow-answerchange", (event) => {
  const { answer } = (event as CustomEvent).detail;
  note(`answer change — ${answer.selected.join(", ") || "nothing selected"}`);
});

task.addEventListener("bitflow-evaluated", (event) => {
  const { result } = (event as CustomEvent).detail;
  note(
    `evaluated — ${result.state}, scoring ${result.score.earned} of ${result.score.possible}`,
  );
});
