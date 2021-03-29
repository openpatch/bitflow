import { zodResolver } from "@hookform/resolvers/zod";
import { ButtonPrimary, Form } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { FormProvider, useForm } from "react-hook-form";
import { EvaluationForm } from "../src/EvaluationForm";
import { ITask, TaskSchema } from "../src/schemas";

export default {
  title: "Tasks/Input/EvaluationForm",
  component: EvaluationForm,
  argTypes: {
    onSubmit: {
      action: "submit",
    },
    onError: {
      action: "error",
    },
  },
} as Meta;

const task: Partial<ITask> = {
  id: "a-id",
  type: "task",
  subtype: "input",
  name: "Title",
  description: "",
  view: {
    instruction: "Instruction",
  },
};

export const Default: Story = (args) => {
  const methods = useForm<ITask>({
    defaultValues: task,
    resolver: zodResolver(TaskSchema),
    shouldUnregister: false,
    reValidateMode: "onBlur",
    mode: "onBlur",
  });
  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(args.onSubmit, args.onError)}>
        <EvaluationForm name="" />
        <ButtonPrimary fullWidth type="submit">
          Submit
        </ButtonPrimary>
      </Form>
    </FormProvider>
  );
};
