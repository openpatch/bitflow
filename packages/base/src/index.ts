export * from "./findLast";
export * from "./groupBy";
export * from "./lerpColor";
export * from "./levenshtein";
export * from "./schemas";
export * from "./uuid";

import { Input, Privacy, Task, TaskAnswer, TaskResult, Title } from "./schemas";

export interface Action {
  type: string;
  payload?: any;
}

export interface TitleProps<T extends Title> {
  title: Pick<T, "view" | "subtype">;
}

export interface TitleViewFormProps {
  name: string;
}

export interface PrivacyProps<P extends Privacy> {
  privacy: Pick<P, "view" | "subtype">;
}
export interface PrivacyViewFormProps {
  name: string;
}

export interface InputProps<I extends Input> {
  input: Pick<I, "view" | "subtype">;
}

export interface InputViewFormProps {
  name: string;
}

export interface TaskProps<
  T extends Task,
  R extends TaskResult,
  A extends TaskAnswer,
  Act extends Action
> {
  mode: "default" | "recording" | "result";
  task: Pick<T, "view" | "subtype">;
  result?: R;
  answer?: A;
  onChange?: (value: A) => void;
  onAction?: (action: Act) => void;
}
export type TaskRef<Act> = {
  dispatch: (action: Act) => void;
};

export interface TaskEvaluationFormProps {
  name: string;
}

export interface TaskViewFormProps {
  name: string;
}

export interface TaskFeedbackFormProps {
  name: string;
}

export interface TaskStatistic {
  count: number;
}

export interface TaskStatisticProps<S extends TaskStatistic, T extends Task> {
  statistic: S;
  task: T;
}

export interface TaskEvaluateParams<A extends TaskAnswer, T extends Task> {
  answer?: A;
  task: T;
}
export type Evaluate<
  A extends TaskAnswer,
  T extends Task,
  R extends TaskResult
> = ({ answer, task }: TaskEvaluateParams<A, T>) => Promise<R>;

export interface UpdateTaskStatisticParams<
  S extends TaskStatistic,
  A extends TaskAnswer,
  T extends Task,
  R extends TaskResult
> {
  statistic?: S;
  answer: A;
  task: T;
  result?: R;
}
export type UpdateTaskStatistic<
  S extends TaskStatistic,
  A extends TaskAnswer,
  T extends Task,
  R extends TaskResult
> = ({
  statistic,
  answer,
  task,
  result,
}: UpdateTaskStatisticParams<S, A, T, R>) => Promise<S>;
