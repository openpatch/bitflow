import { IEnd as EndTries } from "@bitflow/end-tries";
import { IInput as InputMarkdown } from "@bitflow/input-markdown";
import { IStart as StartSimple } from "@bitflow/start-simple";
import {
  IAnswer as TaskChoiceAnswer,
  IResult as TaskChoiceResult,
  IStatistic as TaskChoiceStatistic,
  ITask as TaskChoice,
} from "@bitflow/task-choice";
import {
  IAnswer as TaskFITBAnswer,
  IResult as TaskFITBResult,
  IStatistic as TaskFITBStatistic,
  ITask as TaskFITB,
} from "@bitflow/task-fill-in-the-blank";
import {
  IAnswer as TaskInputAnswer,
  IResult as TaskInputResult,
  IStatistic as TaskInputStatistic,
  ITask as TaskInput,
} from "@bitflow/task-input";
import {
  IAnswer as TaskYesNoAnswer,
  IResult as TaskYesNoResult,
  IStatistic as TaskYesNoStatistic,
  ITask as TaskYesNo,
} from "@bitflow/task-yes-no";
import { ITitle as TitleSimple } from "@bitflow/title-simple";

declare global {
  namespace Bitflow {
    export type Task = TaskChoice | TaskFITB | TaskInput | TaskYesNo;
    export type TaskAnswer =
      | TaskChoiceAnswer
      | TaskFITBAnswer
      | TaskInputAnswer
      | TaskYesNoAnswer;
    export type TaskResult =
      | TaskChoiceResult
      | TaskFITBResult
      | TaskInputResult
      | TaskYesNoResult;
    export type TaskStatistic =
      | TaskChoiceStatistic
      | TaskFITBStatistic
      | TaskInputStatistic
      | TaskYesNoStatistic;
    export type Input = InputMarkdown;
    export type Title = TitleSimple;
    export type Start = StartSimple;
    export type End = EndTries;
  }
}
