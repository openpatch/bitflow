import { zodResolver } from "@hookform/resolvers/zod";
import { ButtonPrimary, Form } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { FormProvider, useForm } from "react-hook-form";
import { FeedbackForm } from "../src/FeedbackForm";
import { TaskSchema } from "../src/schemas";
import { ITask } from "../src/types";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/Task/YesNo/FeedbackForm",
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

export const Example: Story = (args) => {
  const { example } = useInformation();

  const methods = useForm<ITask>({
    resolver: zodResolver(TaskSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    mode: "onBlur",
    defaultValues: example,
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