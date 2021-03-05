import { zodResolver } from "@hookform/resolvers/zod";
import {
  Evaluation,
  Feedback,
  FeedbackFormProps,
  Locales,
  Task,
} from "@openpatch/bits-base";
import { Box, ButtonPrimary, Form, FormHeader } from "@openpatch/patches";
import {
  DefaultValues,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";

export type TaskFeedbackFormShellProps<
  F extends Feedback,
  T extends Task,
  E extends Evaluation
> = {
  schema: any;
  locales?: {
    title: string;
    save: string;
  };
  task: T;
  taskLocales?: Locales;
  evaluation?: E;
  evaluationLocales?: Locales;
  onSubmit: SubmitHandler<F>;
  FeedbackForm: (props: FeedbackFormProps<T, E>) => JSX.Element;
  feedbackFormLocales?: Locales;
  defaultValues?: DefaultValues<F>;
};

export const TaskFeedbackFormShell = <
  F extends Feedback,
  T extends Task,
  E extends Evaluation
>({
  locales = {
    title: "Feedback",
    save: "Save",
  },
  FeedbackForm,
  feedbackFormLocales,
  task,
  taskLocales,
  evaluation,
  evaluationLocales,
  onSubmit,
  schema,
  defaultValues,
}: TaskFeedbackFormShellProps<F, T, E>) => {
  const methods = useForm<F>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Box padding="standard">
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <FormHeader>{locales.title}</FormHeader>
          <FeedbackForm
            locales={feedbackFormLocales}
            task={task}
            taskLocales={taskLocales}
            evaluation={evaluation}
            evaluationLocales={evaluationLocales}
          />
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
