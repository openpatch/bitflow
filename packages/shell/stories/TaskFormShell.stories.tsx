import { Story, Meta } from "@storybook/react/types-6-0";
import { TaskFormShell } from "../src/TaskFormShell";
import {
  ITaskChoice,
  TaskChoiceForm,
  taskChoiceSchema,
} from "@openpatch/bits-task-choice";

export default {
  title: "Shells/TaskForm",
  argTypes: {
    onSubmit: { action: "submit" },
  },
};

export const Default: Story = (args) => {
  return (
    <TaskFormShell<ITaskChoice>
      onSubmit={args.onSubmit}
      TaskForm={TaskChoiceForm}
      schema={taskChoiceSchema}
    />
  );
};

export const Prefilled: Story = (args) => {
  return (
    <TaskFormShell<ITaskChoice>
      onSubmit={args.onSubmit}
      TaskForm={TaskChoiceForm}
      schema={taskChoiceSchema}
      defaultValues={{
        variant: "multiple",
        title: "Prefilled",
      }}
    />
  );
};
