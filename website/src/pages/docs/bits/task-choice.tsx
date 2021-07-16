import * as taskBit from "@bitflow/task-choice";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskChoice() {
  const information = taskBit.useInformation();
  return <TaskBitDoc {...information} taskBit={taskBit} />;
}
