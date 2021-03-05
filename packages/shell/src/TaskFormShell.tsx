import { Locales, Task, TaskFormProps } from "@openpatch/bits-base";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MarkdownEditor,
  HookFormController,
  Input,
  Box,
  ButtonPrimary,
  Form,
  FormHeader,
} from "@openpatch/patches";

export type TaskFormShellProps<T extends Task> = {
  schema: any;
  locales?: {
    save: string;
  };
  taskFormLocales?: Locales;
  onSubmit: SubmitHandler<T>;
  TaskForm: (props: TaskFormProps) => JSX.Element;
  defaultValues?: DefaultValues<T>;
};

export const TaskFormShell = <T extends Task>({
  schema,
  onSubmit,
  TaskForm,
  defaultValues,
  taskFormLocales,
  locales = {
    save: "Save",
  },
}: TaskFormShellProps<T>) => {
  const methods = useForm<T>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(schema),
    defaultValues,
  });
  return (
    <Box padding="standard">
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <FormHeader>Task Form</FormHeader>

          <HookFormController
            name="title"
            defaultValue=""
            control={methods.control as any}
            label="Title"
            render={Input}
          />
          <HookFormController
            name="instruction"
            control={methods.control as any}
            label="Instruction"
            defaultValue=""
            render={({ value, onChange, onBlur }) => (
              <MarkdownEditor
                value={value}
                variant="input"
                onChange={(_, v) => onChange(v)}
                onBlur={onBlur}
              />
            )}
          />
          <TaskForm {...methods} locales={taskFormLocales} />
          <Box mt="standard">
            <ButtonPrimary
              disabled={
                !methods.formState.isDirty || methods.formState.isSubmitting
              }
              type="submit"
              fullWidth
            >
              {locales.save}
            </ButtonPrimary>
          </Box>
        </Form>
      </FormProvider>
    </Box>
  );
};
