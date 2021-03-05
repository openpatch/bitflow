import { TaskFeedbackFormShell } from "@openpatch/bits-shell";
import { Meta, Story } from "@storybook/react/types-6-0";
import { IEvaluation } from "../dist/types/types";
import { FeedbackForm } from "../src/FeedbackForm";
import { feedbackSchema } from "../src/schemas";
import { IFeedback, ITask } from "../src/types";

export default {
  title: "Tasks/Multiple Choice/FeedbackForm",
  component: FeedbackForm,
  argTypes: {
    onSubmit: {
      action: "submit",
    },
  },
} as Meta;

const task: ITask = {
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

const evaluation: IEvaluation = {
  mode: "auto",
  correct: ["a"],
  enableRetry: false,
  showFeedback: false,
};

export const Shell: Story = (args) => {
  return (
    <TaskFeedbackFormShell<IFeedback, ITask, IEvaluation>
      onSubmit={args.onSubmit}
      FeedbackForm={FeedbackForm}
      schema={feedbackSchema({ task, evaluation })}
      task={task}
    />
  );
};
