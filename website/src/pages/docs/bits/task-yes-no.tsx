import * as taskBit from "@bitflow/task-yes-no";
import { TaskBitDoc } from "../../../components/TaskBitDoc";

export default function TaskYesNo() {
  const information = taskBit.useInformation();
  return <TaskBitDoc {...information} taskBit={taskBit} />;
}
