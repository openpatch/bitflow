import {
  ITaskChoice,
  ITaskChoiceEvaluation,
  ITaskChoiceFeedback,
  TaskChoiceFeedbackForm,
  taskChoiceFeedbackSchema,
} from "@openpatch/bits-task-choice";
import { Meta, Story } from "@storybook/react/types-6-0";
import { TaskFeedbackFormShell } from "../src/TaskFeedbackFormShell";

export default {
  title: "Shells/TaskFeedbackFormShell",
  component: TaskChoiceFeedbackForm,
  argTypes: {
    onSubmit: {
      action: "submit",
    },
  },
} as Meta;

const task: ITaskChoice = {
  title: "Title",
  instruction: "Instruction",
  variant: "single",
  choices: [
    {
      markdown: "A",
    },
    {
      markdown: "B",
    },
  ],
};

const evaluation: ITaskChoiceEvaluation = {
  mode: "auto",
  correct: ["a"],
  enableRetry: false,
  showFeedback: false,
};

export const Shell: Story = (args) => {
  return (
    <TaskFeedbackFormShell<
      ITaskChoiceFeedback,
      ITaskChoice,
      ITaskChoiceEvaluation
    >
      onSubmit={args.onSubmit}
      FeedbackForm={TaskChoiceFeedbackForm}
      schema={taskChoiceFeedbackSchema({ task, evaluation })}
      task={task}
    />
  );
};
