import * as taskBit from "@bitflow/task-choice";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskChoice() {
  return (
    <TaskBitDoc<taskBit.ITask>
      description=""
      taskBit={taskBit}
      actions={[
        `
"type": "check",
"payload": {
  "choice": "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
  "variant": "single" | "multiple"
}
`,
        `
"type": "uncheck",
"payload": {
  "choice": "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
  "variant": "single" | "multiple"
}
`,
      ]}
      defaultValues={{
        description: "",
        subtype: "choice",
        view: {
          instruction: "**This is an instruction**",
          variant: "single",
          choices: [
            { markdown: "Answer A" },
            { markdown: "Answer B" },
            { markdown: "Answer C" },
            { markdown: "Answer D" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: false,
          showFeedback: true,
          correct: ["a"],
        },
        feedback: {
          choices: {},
          patterns: {},
        },
        name: "Example",
      }}
    ></TaskBitDoc>
  );
}
