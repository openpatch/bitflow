export {
  IAction as ITaskChoiceAction,
  IAnswer as ITaskChoiceAnswer,
  IEvaluation as ITaskChoiceEvaluation,
  IFeedback as ITaskChoiceFeedback,
  IResult as ITaskChoiceResult,
  IStatistic as ITaskChoiceStatistic,
  ITask as ITaskChoice,
} from "./types";

export { evaluate as taskChoiceEvaluate } from "./evaluate";
export { EvaluationForm as TaskChoiceEvaluationForm } from "./EvaluationForm";
export { FeedbackForm as TaskChoiceFeedbackForm } from "./FeedbackForm";
export { Statistic as TaskChoiceStatistic } from "./Statistic";
export { Task as TaskChoice } from "./Task";
export { TaskForm as TaskChoiceForm } from "./TaskForm";
export { updateStatistic as taskChoiceUpdateStatistic } from "./updateStatistic";
export {
  evaluationSchema as taskChoiceEvaluationSchema,
  feedbackSchema as taskChoiceFeedbackSchema,
  taskSchema as taskChoiceSchema,
} from "./schemas";
export {
  validateEvaluation as taskChoiceValidateEvaluation,
  validateFeedback as taskChoiceValidateFeedback,
  validateTask as taskChoiceValidateTask,
} from "./validate";
