import {
  ValidateTask,
  ValidateEvaluation,
  ValidateFeedback,
} from "@openpatch/bits-base";
import { IEvaluation, ITask, IFeedback } from "./types";
import { taskSchema, evaluationSchema, feedbackSchema } from "./schemas";

export const validateTask: ValidateTask<ITask> = ({ task }) =>
  new Promise((resolve) => {
    const result = taskSchema.safeParse(task);

    if (!result.success) {
      return resolve({
        success: false,
        errors: result.error.errors,
      });
    }
    const data: ITask = result.data;

    return resolve({
      success: true,
      data,
    });
  });

export const validateEvaluation: ValidateEvaluation<IEvaluation, ITask> = ({
  task,
  evaluation,
}) =>
  new Promise((resolve) => {
    const result = evaluationSchema({ task }).safeParse(evaluation);

    if (!result.success) {
      return resolve({
        success: false,
        errors: result.error.errors,
      });
    }
    const data: IEvaluation = result.data;

    return resolve({
      success: true,
      data,
    });
  });

export const validateFeedback: ValidateFeedback<
  IFeedback,
  ITask,
  IEvaluation
> = ({ task, evaluation, feedback }) =>
  new Promise((resolve) => {
    const result = feedbackSchema({ task, evaluation }).safeParse(feedback);

    if (!result.success) {
      return resolve({
        success: false,
        errors: result.error.errors,
      });
    }
    const data: IFeedback = result.data;

    return resolve({
      success: true,
      data,
    });
  });
