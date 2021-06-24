import * as taskBit from "@bitflow/task-fill-in-the-blank";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskFillInTheBlank() {
  return (
    <TaskBitDoc<taskBit.ITask>
      description=""
      taskBit={taskBit}
      actions={[
        `
"type": "change-blank",
"payload": {
  "blank": "string",
  "value": "string"
}
`,
      ]}
      defaultValues={{
        description: "",
        subtype: "fill-in-the-blank",
        view: {
          instruction: "**This is an instruction**",
          textWithBlanks: `
~~A~~ a test ~~B~~
`,
        },
        evaluation: {
          mode: "auto",
          blanks: {
            a: "[hH]allo",
          },
          enableRetry: false,
          showFeedback: true,
        },
        feedback: {
          blanks: {},
        },
        name: "Example",
      }}
    ></TaskBitDoc>
  );
}
