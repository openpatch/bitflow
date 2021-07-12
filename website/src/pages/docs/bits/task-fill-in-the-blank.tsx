import * as taskBit from "@bitflow/task-fill-in-the-blank";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskFillInTheBlank() {
  return (
    <TaskBitDoc<taskBit.ITask>
      description={`
A task bit allowing to create fill in the blank texts. The text can be written
in Markdown. The strike-through syntax will create a blank. The answers of a user
can be automatically evaluated, if you provide regular expressions for the
blanks. You can also provide feedback by using regular expression, as well.
`}
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
