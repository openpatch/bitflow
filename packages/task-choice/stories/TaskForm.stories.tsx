import { TaskFormShell } from "@openpatch/bits-shell";
import { Meta, Story } from "@storybook/react/types-6-0";
import { taskSchema } from "../src/schemas";
import { TaskForm } from "../src/TaskForm";
import { ITask } from "../src/types";

export default {
  title: "Tasks/Multiple Choice/TaskForm",
  component: TaskForm,
  argTypes: {
    onSubmit: {
      action: "submit",
    },
  },
} as Meta;

export const Shell: Story = (args) => {
  return (
    <TaskFormShell<ITask>
      onSubmit={args.onSubmit}
      TaskForm={TaskForm}
      schema={taskSchema}
    />
  );
};
