import { zodResolver } from "@hookform/resolvers/zod";
import { ButtonPrimary, Form } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { FormProvider, useForm } from "react-hook-form";
import { EndSchema } from "../src/schemas";
import { IEnd } from "../src/types";
import { useInformation } from "../src/useInformation";
import { ViewForm } from "../src/ViewForm";

export default {
  title: "Bits/End/{{ properCase name }}/ViewForm",
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

export const Example: Story = (args) => {
  const { example } = useInformation();

  const methods = useForm<IEnd>({
    resolver: zodResolver(EndSchema),
    reValidateMode: "onBlur",
    shouldUnregister: false,
    mode: "onBlur",
    defaultValues: example,
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