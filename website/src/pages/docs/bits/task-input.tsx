import * as taskBit from "@bitflow/task-input";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskInput() {
  return (
    <TaskBitDoc<taskBit.ITask>
      description={`
A task bit for creating single line response questions. The answer of a user can
be automatically evaluated by providing a regular expression. You can also give
feedback by using regular expression, as well.
`}
      taskBit={taskBit}
      actions={[
        `
"type": "change",
"payload": {
  "input": "string"
}
`,
      ]}
      defaultValues={{
        description: "",
        subtype: "input",
        view: {
          instruction: "You may input abc",
        },
        evaluation: {
          mode: "auto",
          pattern: "abc",
          enableRetry: false,
          showFeedback: true,
        },
        feedback: {
          patterns: [],
        },
        name: "Example",
      }}
    ></TaskBitDoc>
  );
}
