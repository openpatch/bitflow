import { FC } from "react";

export * from "./lerpColor";
export * from "./levenshtein";
export * from "./uuid";

export type LocaleFunction = (...params: any[]) => string;
export type Locales = Record<string, string | LocaleFunction>;

export interface Title {}

export interface TitleProps<T extends Title> {
  title: T;
  locales?: Locales;
}
export interface TitleFormProps {
  locales?: Locales;
}

export interface Privacy {}

export interface PrivacyProps<P extends Privacy> {
  privacy: P;
  locales?: Locales;
}
export interface PrivacyFormProps {
  locales?: Locales;
}

export interface Input {}

export interface InputProps<I extends Input> {
  input: I;
  locales?: Locales;
}
export interface InputFormProps {
  locales?: Locales;
}

export interface Action {
  type: string;
  payload?: any;
}

export interface Answer {}
export interface Result {
  state: "correct" | "wrong" | "unknown" | "manual";
  allowRetry?: boolean;
  feedback?: any;
}
export interface Feedback {}
export interface FeedbackFormProps<T extends Task, E extends Evaluation> {
  locales?: Locales;
  task: T;
  taskLocales?: Locales;
  evaluation: E;
  evaluationLocales?: Locales;
}

export interface Task {
  title: string;
  instruction: string;
}
export interface TaskProps<
  T extends Task,
  R extends Result,
  A extends Answer,
  Act extends Action
> {
  mode: "default" | "recording" | "result";
  task: T;
  locales?: Locales;
  result?: R;
  answer?: A;
  onChange?: (value: A) => void;
  onAction?: (action: Act) => void;
}
export type TaskRef<Act> = {
  dispatch: (action: Act) => void;
};

export interface TaskFormProps {
  locales?: Locales;
}

export interface Evaluation {
  mode: "auto" | "skip" | "manual";
  enableRetry: boolean;
  showFeedback: boolean;
}
export interface EvaluationFormProps<T extends Task> {
  locales?: Locales;
  task: T;
  taskLocales?: Locales;
}

export interface Statistic {
  count: number;
}
export interface StatisticProps<
  S extends Statistic,
  T extends Task,
  E extends Evaluation
> {
  statistic: S;
  locales?: Locales;
  task: T;
  taskLocales?: Locales;
  evaluation: E;
  evaluationLocales?: Locales;
}
export type StatisticFC<
  S extends Statistic,
  T extends Task,
  E extends Evaluation
> = FC<StatisticProps<S, T, E>>;

export interface ValidationError {
  code: string;
  path: (string | number)[];
  message: string;
}

export interface ValidateTaskParams {
  task: any;
}
export type ValidateTask<T extends Task> = ({
  task,
}: ValidateTaskParams) => Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: ValidationError[];
    }
>;

export interface ValidateEvaluationParams<T extends Task> {
  task: T;
  evaluation: any;
}
export type ValidateEvaluation<E extends Evaluation, T extends Task> = ({
  task,
  evaluation,
}: ValidateEvaluationParams<T>) => Promise<
  | {
      success: true;
      data: E;
    }
  | {
      success: false;
      errors: ValidationError[];
    }
>;

export interface ValidateFeedbackParams<T extends Task, E extends Evaluation> {
  task: T;
  evaluation: E;
  feedback: any;
}
export type ValidateFeedback<
  F extends Feedback,
  T extends Task,
  E extends Evaluation
> = ({
  task,
  evaluation,
  feedback,
}: ValidateFeedbackParams<T, E>) => Promise<
  | {
      success: true;
      data: F;
    }
  | {
      success: false;
      errors: ValidationError[];
    }
>;

export interface EvaluateParams<
  A extends Answer,
  E extends Evaluation,
  T extends Task,
  F extends Feedback
> {
  answer?: A;
  evaluation: E;
  task: T;
  feedback?: F;
}
export type Evaluate<
  A extends Answer,
  E extends Evaluation,
  T extends Task,
  R extends Result,
  F extends Feedback
> = ({ answer, evaluation, task }: EvaluateParams<A, E, T, F>) => Promise<R>;

export interface UpdateStatisticParams<
  S extends Statistic,
  A extends Answer,
  T extends Task,
  R extends Result,
  E extends Evaluation,
  F extends Feedback
> {
  statistic?: S;
  answer: A;
  task: T;
  result?: R;
  evaluation: E;
  feedback?: F;
}
export type UpdateStatistic<
  S extends Statistic,
  A extends Answer,
  T extends Task,
  R extends Result,
  E extends Evaluation,
  F extends Feedback
> = ({
  statistic,
  answer,
  task,
  result,
  evaluation,
  feedback,
}: UpdateStatisticParams<S, A, T, R, E, F>) => Promise<S>;
