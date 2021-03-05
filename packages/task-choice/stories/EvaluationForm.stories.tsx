import { TaskEvaluationFormShell } from "@openpatch/bits-shell";
import { Meta, Story } from "@storybook/react/types-6-0";
import { EvaluationForm } from "../src/EvaluationForm";
import { evaluationSchema } from "../src/schemas";
import { IEvaluation, ITask } from "../src/types";

export default {
  title: "Tasks/Multiple Choice/EvaluationForm",
  component: EvaluationForm,
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

export const Shell: Story = (args) => {
  return (
    <TaskEvaluationFormShell<IEvaluation, ITask>
      onSubmit={args.onSubmit}
      EvaluationForm={EvaluationForm}
      schema={evaluationSchema({ task })}
      task={task}
    />
  );
};
