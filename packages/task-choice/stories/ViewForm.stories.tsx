import { zodResolver } from "@hookform/resolvers/zod";
import { ButtonPrimary, Form } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { FormProvider, useForm } from "react-hook-form";
import { TaskSchema } from "../src/schemas";
import { ITask } from "../src/types";
import { ViewForm } from "../src/ViewForm";

export default {
  title: "Bits/Task/Multiple Choice/ViewForm",
  component: ViewForm,
  argTypes: {
    onSubmit: {
      action: "submit",
    },
    onError: {
      action: "error",
    },
  },
} as Meta;

export const Default: Story = (args) => {
  const methods = useForm<ITask>({
    resolver: zodResolver(TaskSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    mode: "onBlur",
  });
  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(args.onSubmit, args.onError)}>
        <ViewForm name="" />
        <ButtonPrimary fullWidth type="submit">
          Submit
        </ButtonPrimary>
      </Form>
    </FormProvider>
  );
};
