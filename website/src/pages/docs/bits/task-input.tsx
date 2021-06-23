import * as taskBit from "@bitflow/task-input";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskInput() {
  return (
    <TaskBitDoc<taskBit.ITask>
      name="input"
      description=""
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
