import { Evaluate, Flow } from "@bitflow/core";
import { useBitTask } from "@bitflow/provider";
import { TaskShell } from "@bitflow/shell";
import {
  Box,
  Checkbox,
  HookFormController,
  Input,
  MarkdownEditor,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import translations from "./locales.vocab";
import { TabContainer } from "./TabContainer";

const MetaForm = ({ name }: { name: `nodes.${number}` }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        label={t("name")}
        name={`${name}.data.name`}
        defaultValue=""
        render={Input}
      />
      <HookFormController
        label={t("description")}
        name={`${name}.data.description`}
        defaultValue=""
        render={({ value, onChange }) => (
          <MarkdownEditor
            value={value}
            variant="input"
            onChange={(v) => onChange(v)}
          />
        )}
      />
    </Fragment>
  );
};

const ViewForm = ({ name }: { name: `nodes.${number}` }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);
  const node = getValues(name);

  if (node.type !== "task") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const taskBit = useBitTask(node.data.subtype);

  if (taskBit) {
    return <taskBit.ViewForm name={`${name}.data`} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const EvaluationForm = ({ name }: { name: `nodes.${number}` }) => {
  const { getValues, watch } = useFormContext<Flow>();
  const { t } = useTranslations(translations);
  const node = getValues(name);
  if (node.type !== "task") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const mode = watch(`${name}.data.evaluation.mode`);
  const taskBit = useBitTask(node.data.subtype);

  if (taskBit) {
    return (
      <Fragment>
        <HookFormController
          name={`${name}.data.evaluation.mode`}
          label={t("evaluation-mode")}
          defaultValue="auto"
          render={({ value, onChange, onBlur }) => (
            <Select value={value} onChange={onChange} onBlur={onBlur}>
              <option value="auto">{t("evaluation-mode-auto")}</option>
              <option value="manual">{t("evaluation-mode-manual")}</option>
              <option value="skip">{t("evaluation-mode-skip")}</option>
            </Select>
          )}
        />
        {mode !== "skip" && (
          <Fragment>
            <HookFormController
              name={`${name}.data.evaluation.enableRetry`}
              defaultValue={false}
              render={({ value, onChange, onBlur }) => (
                <Box mt="standard">
                  <Checkbox checked={value} onChange={onChange} onBlur={onBlur}>
                    {t("evaluation-enable-retry")}
                  </Checkbox>
                </Box>
              )}
            />
            <HookFormController
              name={`${name}.data.evaluation.showFeedback`}
              defaultValue={false}
              render={({ value, onChange, onBlur }) => (
                <Box mt="standard">
                  <Checkbox checked={value} onChange={onChange} onBlur={onBlur}>
                    {t("evaluation-show-feedback")}
                  </Checkbox>
                </Box>
              )}
            />
            <taskBit.EvaluationForm name={`${name}.data`} />
          </Fragment>
        )}
      </Fragment>
    );
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const FeedbackForm = ({ name }: { name: `nodes.${number}` }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);
  const node = getValues(name);

  if (node.type !== "task") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const taskBit = useBitTask(node.data.subtype);

  if (taskBit) {
    return <taskBit.FeedbackForm name={`${name}.data`} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({
  name,
  onEvaluate,
}: {
  name: `nodes.${number}`;
  onEvaluate?: Evaluate;
}) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);

  const node = getValues(name);

  if (node.type !== "task") {
    return <div>{t("bit-type-unsupported")}</div>;
  }
  const onNext = async () => {};
  const onSkip = async () => {};
  const onRetry = async () => {};
  const subtype = node.data.subtype;
  const taskBit = useBitTask(subtype);

  const evaluate = async (answer: Bitflow.TaskAnswer) => {
    if (!onEvaluate) {
      throw new Error("missing evaluate");
    }
    const r = await onEvaluate({ answer, task: node.data });
    return r;
  };

  if (taskBit) {
    return (
      <TaskShell
        header="Preview"
        mode="default"
        evaluate={onEvaluate ? evaluate : undefined}
        onNext={onNext}
        onSkip={onSkip}
        onRetry={onRetry}
        task={node.data}
        TaskComponent={taskBit.Task}
      />
    );
  } else {
    return <div>{t("bit-type-unsupported")}</div>;
  }
};

export const TaskPropertiesSidebar = ({
  name,
  onEvaluate,
}: {
  name: `nodes.${number}`;
  onEvaluate?: Evaluate;
}) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <Tabs>
        <TabList inverted tone="neutral">
          <Tab>{t("meta")}</Tab>
          <Tab>{t("view")}</Tab>
          <Tab>{t("evaluation")}</Tab>
          <Tab>{t("feedback")}</Tab>
          <Tab>{t("preview")}</Tab>
        </TabList>
        <TabContainer>
          <TabPanel>
            <MetaForm name={name} />
          </TabPanel>
          <TabPanel>
            <ViewForm name={name} />
          </TabPanel>
          <TabPanel>
            <EvaluationForm name={name} />
          </TabPanel>
          <TabPanel>
            <FeedbackForm name={name} />
          </TabPanel>
          <TabPanel>
            <Preview name={name} onEvaluate={onEvaluate} />
          </TabPanel>
        </TabContainer>
      </Tabs>
    </Fragment>
  );
};
