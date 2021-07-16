import * as taskBit from "@bitflow/task-input";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskInput() {
  const information = taskBit.useInformation();
  return <TaskBitDoc {...information} taskBit={taskBit} />;
}
