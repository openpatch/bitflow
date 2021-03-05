import { Meta, Story } from "@storybook/react/types-6-0";
import {
  TaskChoiceEvaluationForm,
  taskChoiceEvaluationSchema,
  ITaskChoiceEvaluation,
  ITaskChoice,
} from "@openpatch/bits-task-choice";
import { TaskEvaluationFormShell } from "../src/TaskEvaluationFormShell";

export default {
  title: "Shells/TaskEvaluationFormShell",
  component: TaskChoiceEvaluationForm,
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

export const Shell: Story = (args) => {
  return (
    <TaskEvaluationFormShell<ITaskChoiceEvaluation, ITaskChoice>
      onSubmit={args.onSubmit}
      EvaluationForm={TaskChoiceEvaluationForm}
      schema={taskChoiceEvaluationSchema({ task })}
      task={task}
    />
  );
};
