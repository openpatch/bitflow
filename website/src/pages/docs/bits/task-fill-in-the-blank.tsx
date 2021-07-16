import * as taskBit from "@bitflow/task-fill-in-the-blank";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskFillInTheBlank() {
  const information = taskBit.useInformation();
  return <TaskBitDoc {...information} taskBit={taskBit} />;
}
