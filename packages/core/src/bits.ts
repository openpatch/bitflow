import { ForwardRefExoticComponent, ReactElement, RefAttributes } from "react";
import { ZodSchema } from "zod";
import { DoResult } from "./do";

export interface Action {
  type: string;
  payload?: any;
}

export interface FeedbackMessage {
  message: string;
  severity: "error" | "warning" | "info" | "success";
}

export interface TitleProps<T extends Bitflow.Title> {
  title: Pick<T, "view" | "subtype">;
}

export interface TitleViewFormProps {
  name: string;
}

export interface TitleBit<T extends Bitflow.Title = any> {
  ViewForm: (props: TitleViewFormProps) => ReactElement | null;
  Title: (props: TitleProps<T>) => ReactElement | null;
  TitleSchema: ZodSchema<T>;
  useInformation: () => {
    name: string;
    description: string;
    example: T;
  };
}

export interface InputProps<I extends Bitflow.Input> {
  input: Pick<I, "view" | "subtype">;
}

export interface InputViewFormProps {
  name: string;
}

export interface InputBit<I extends Bitflow.Input = any> {
  ViewForm: (props: InputViewFormProps) => ReactElement | null;
  Input: (props: InputProps<I>) => ReactElement | null;
  useInformation: () => {
    name: string;
    description: string;
    example: I;
  };
  InputSchema: ZodSchema<I>;
}

export interface StartProps<S extends Bitflow.Start> {
  start: Pick<S, "view" | "subtype">;
}

export interface StartViewFormProps {
  name: string;
}

export interface StartBit<S extends Bitflow.Start = any> {
  ViewForm: (props: StartViewFormProps) => ReactElement | null;
  Start: (props: StartProps<S>) => ReactElement | null;
  StartSchema: ZodSchema<S>;
  useInformation: () => {
    name: string;
    description: string;
    example: S;
  };
}

export interface EndProps<E extends Bitflow.End> {
  end: Pick<E, "view" | "subtype">;
  getResult: () => Promise<DoResult>;
}

export interface EndViewFormProps {
  name: string;
}

export interface EndBit<E extends Bitflow.End = any> {
  ViewForm: (props: EndViewFormProps) => ReactElement | null;
  End: (props: EndProps<E>) => ReactElement | null;
  useInformation: () => {
    name: string;
    description: string;
    example: E;
  };
  EndSchema: ZodSchema<E>;
}

export interface TaskProps<
  T extends Bitflow.Task,
  R extends Bitflow.TaskResult,
  A extends Bitflow.TaskAnswer,
  Act extends Action
> {
  mode: "default" | "recording" | "result";
  task: Pick<T, "view" | "subtype">;
  result?: R;
  answer?: A;
  onChange?: (value: A) => void;
  onAction?: (action: Act) => void;
}

export interface TaskRef<Act> {
  dispatch: (action: Act) => void;
}

export interface TaskEvaluationFormProps {
  name: string;
}

export interface TaskViewFormProps {
  name: string;
}

export interface TaskFeedbackFormProps {
  name: string;
}

export interface TaskStatisticProps<
  S extends Bitflow.TaskStatistic,
  T extends Bitflow.Task
> {
  statistic: S;
  task: T;
}

export interface TaskEvaluateParams<
  A extends Bitflow.TaskAnswer,
  T extends Bitflow.Task
> {
  answer?: A;
  task: T;
}
export type Evaluate<
  A extends Bitflow.TaskAnswer = Bitflow.TaskAnswer,
  T extends Bitflow.Task = Bitflow.Task,
  R extends Bitflow.TaskResult = Bitflow.TaskResult
> = ({ answer, task }: TaskEvaluateParams<A, T>) => Promise<R>;

export interface UpdateTaskStatisticParams<
  S extends Bitflow.TaskStatistic,
  A extends Bitflow.TaskAnswer,
  T extends Bitflow.Task,
  R extends Bitflow.TaskResult
> {
  statistic?: S;
  answer: A;
  task: T;
  result?: R;
}
export type UpdateTaskStatistic<
  S extends Bitflow.TaskStatistic,
  A extends Bitflow.TaskAnswer,
  T extends Bitflow.Task,
  R extends Bitflow.TaskResult
> = ({
  statistic,
  answer,
  task,
  result,
}: UpdateTaskStatisticParams<S, A, T, R>) => Promise<S>;

export interface TaskBit<
  T extends Bitflow.Task,
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult,
  S extends Bitflow.TaskStatistic,
  Act extends Action
> {
  ViewForm: (props: TaskViewFormProps) => ReactElement | null;
  EvaluationForm: (props: TaskEvaluationFormProps) => ReactElement | null;
  FeedbackForm: (props: TaskFeedbackFormProps) => ReactElement | null;
  Task: ForwardRefExoticComponent<
    TaskProps<T, R, A, Act> & RefAttributes<TaskRef<Act>>
  >;
  Statistic: (props: TaskStatisticProps<S, T>) => ReactElement | null;
  updateStatistic: UpdateTaskStatistic<S, A, T, R>;
  TaskSchema: ZodSchema<T>;
  useInformation: () => {
    name: string;
    description: string;
    example: T;
  };
  evaluate: Evaluate<A, T, R>;
}

export const makeEvaluate =
  (evaluateMap: Record<string, Evaluate>): Evaluate =>
  ({ task, answer }) => {
    const subtype = task.subtype;
    const evaluate = evaluateMap[subtype];

    if (!evaluate) {
      throw new Error("subtype not supported");
    }

    return evaluate({ answer, task });
  };
