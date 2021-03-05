import { zodResolver } from "@hookform/resolvers/zod";
import {
  Evaluation,
  EvaluationFormProps,
  Locales,
  Task,
} from "@openpatch/bits-base";
import {
  AutoGrid,
  Box,
  ButtonPrimary,
  Checkbox,
  Form,
  FormHeader,
  FormHelperText,
  FormLabel,
  HookFormController,
  Select,
} from "@openpatch/patches";
import { Fragment } from "react";
import {
  DefaultValues,
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";

export type TaskEvaluationFormShellProps<
  E extends Evaluation,
  T extends Task
> = {
  schema: any;
  locales?: {
    title: string;
    save: string;
    mode: string;
    modeAuto: string;
    modeAutoHelp: string;
    modeManual: string;
    modeManualHelp: string;
    modeSkip: string;
    modeSkipHelp: string;
    enableRetry: string;
    enableRetryHelp: string;
    showFeedback: string;
    showFeedbackHelp: string;
    behaviour: string;
  };
  taskLocales?: Locales;
  task: T;
  onSubmit: SubmitHandler<E>;
  EvaluationForm: (props: EvaluationFormProps<T>) => JSX.Element;
  evaluationFormLocales?: Locales;
  defaultValues?: DefaultValues<E>;
};

export const TaskEvaluationFormShell = <E extends Evaluation, T extends Task>({
  schema,
  task,
  onSubmit,
  EvaluationForm,
  evaluationFormLocales,
  defaultValues,
  taskLocales,
  locales = {
    title: "Evaluation",
    save: "Save",
    mode: "Mode",
    modeAuto: "Automatic",
    modeAutoHelp:
      "In this mode answers will be evaluated automatically. Students receive a wrong or correct notification.",
    modeManual: "Manual",
    modeManualHelp:
      "In this mode answers will be evaluated automatically. Students receive a this task is marked manually notification.",
    modeSkip: "Skip",
    modeSkipHelp:
      "In this mode nothing will happen. Students receive a thanks for submitting notification.",
    enableRetry: "Enable Retry",
    enableRetryHelp: "Show a retry button",
    showFeedback: "Show Feedback",
    showFeedbackHelp: "Needs to be configured in the feedback settings.",
    behaviour: "Behaviour",
  },
}: TaskEvaluationFormShellProps<E, T>) => {
  const methods = useForm<E>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(schema),
    defaultValues,
  });

  const mode = useWatch({
    control: methods.control as any,
    name: "mode",
    defaultValue: "auto",
  });

  let modeHelp: string = "";
  switch (mode) {
    case "auto": {
      modeHelp = locales.modeAutoHelp;
      break;
    }
    case "manual": {
      modeHelp = locales.modeManualHelp;
      break;
    }
    case "skip": {
      modeHelp = locales.modeSkipHelp;
      break;
    }
  }

  return (
    <Box padding="standard">
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <FormHeader>{locales.title}</FormHeader>
          <HookFormController
            name="mode"
            defaultValue="auto"
            control={methods.control as any}
            label={locales.mode}
            render={({ value, onChange, onBlur }) => (
              <Select value={value} onChange={onChange} onBlur={onBlur}>
                <option value="auto">{locales.modeAuto}</option>
                <option value="manual">{locales.modeManual}</option>
                <option value="skip">{locales.modeSkip}</option>
              </Select>
            )}
          />
          <FormHelperText>{modeHelp}</FormHelperText>
          {mode !== "skip" && (
            <Fragment>
              <FormLabel htmlFor="">{locales.behaviour}</FormLabel>
              <AutoGrid gap="small">
                <Box>
                  <HookFormController
                    name="enableRetry"
                    control={methods.control as any}
                    defaultValue={false}
                    helperText={locales.enableRetryHelp}
                    render={({ value, onChange, onBlur, required }) => (
                      <Checkbox
                        onChange={onChange}
                        checked={value}
                        onBlur={onBlur}
                        required={required}
                      >
                        {locales.enableRetry}
                      </Checkbox>
                    )}
                  />
                </Box>
                <Box>
                  <HookFormController
                    name="showFeedback"
                    defaultValue={false}
                    control={methods.control as any}
                    helperText={locales.showFeedbackHelp}
                    render={({ value, onChange, onBlur, required }) => (
                      <Checkbox
                        onChange={onChange}
                        checked={value}
                        onBlur={onBlur}
                        required={required}
                      >
                        {locales.showFeedback}
                      </Checkbox>
                    )}
                  />
                </Box>
              </AutoGrid>
              <EvaluationForm
                task={task}
                locales={evaluationFormLocales}
                taskLocales={taskLocales}
              />
            </Fragment>
          )}
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
