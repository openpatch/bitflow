import type {
  Task,
  TaskResult,
  TaskStatistic,
  TaskAnswer,
  Input,
  Title,
  Start,
  End,
} from "@bitflow/bits";

declare global {
  namespace Bitflow {
    export {
      Task,
      TaskResult,
      TaskStatistic,
      TaskAnswer,
      Input,
      Title,
      Start,
      End,
    };
  }
}
