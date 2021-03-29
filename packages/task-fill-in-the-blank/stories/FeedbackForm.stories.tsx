import { zodResolver } from "@hookform/resolvers/zod";
import { ButtonPrimary, Form } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { FormProvider, useForm } from "react-hook-form";
import { FeedbackForm } from "../src/FeedbackForm";
import { ITask, TaskSchema } from "../src/schemas";

export default {
  title: "Tasks/Fill in the blank/FeedbackForm",
  component: FeedbackForm,
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
  subtype: "fill-in-the-blank",
  name: "Title",
  description: "",
  view: {
    instruction: "Instruction",
    textWithBlanks: "~~A~~ and ~~Another Blank~~",
  },
  evaluation: {
    mode: "auto",
    blanks: {},
    enableRetry: false,
    showFeedback: false,
  },
};

export const Default: Story = (args) => {
  const methods = useForm<ITask>({
    defaultValues: task,
    resolver: zodResolver(TaskSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    mode: "onBlur",
  });
  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(args.onSubmit, args.onError)}>
        <FeedbackForm name="" />
        <ButtonPrimary fullWidth type="submit">
          Submit
        </ButtonPrimary>
      </Form>
    </FormProvider>
  );
};
