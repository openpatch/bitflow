import { taskBits } from "@bitflow/bits";
import { TaskShell } from "@bitflow/shell";
import {
  Box,
  Checkbox,
  HookFormController,
  Input,
  MarkdownEditor,
  Select,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment, useState } from "react";
import { useFormContext } from "react-hook-form";
import translations from "../locales.vocab";
import { IFlow } from "../schemas";
import { Tab, TabPanel, Tabs } from "./Tabs";

const MetaForm = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        label={t("name")}
        name={`${name}.name`}
        defaultValue=""
        render={Input}
      />
      <HookFormController
        label={t("description")}
        name={`${name}.description`}
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
    </Fragment>
  );
};

const ViewForm = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<IFlow>();
  const { t } = useTranslations(translations);

  const subtype = getValues(`${name}.subtype`) as keyof typeof taskBits;
  console.log(subtype);

  const { ViewForm } = taskBits[subtype];

  if (ViewForm) {
    return <ViewForm name={name} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const EvaluationForm = ({ name }: { name: string }) => {
  const { getValues, watch } = useFormContext<IFlow>();
  const { t } = useTranslations(translations);

  const mode = watch(`${name}.evaluation.mode`);
  const subtype = getValues(`${name}.subtype`) as keyof typeof taskBits;

  const { EvaluationForm } = taskBits[subtype];

  if (EvaluationForm) {
    return (
      <Fragment>
        <HookFormController
          name={`${name}.evaluation.mode`}
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
              name={`${name}.evaluation.enableRetry`}
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
              name={`${name}.evaluation.showFeedback`}
              defaultValue={false}
              render={({ value, onChange, onBlur }) => (
                <Box mt="standard">
                  <Checkbox checked={value} onChange={onChange} onBlur={onBlur}>
                    {t("evaluation-show-feedback")}
                  </Checkbox>
                </Box>
              )}
            />
            <EvaluationForm name={name} />
          </Fragment>
        )}
      </Fragment>
    );
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const FeedbackForm = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<IFlow>();
  const { t } = useTranslations(translations);

  const subtype = getValues(`${name}.subtype`) as keyof typeof taskBits;

  const { FeedbackForm } = taskBits[subtype];

  if (FeedbackForm) {
    return <FeedbackForm name={name} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<IFlow>();
  const { t } = useTranslations(translations);

  const props = getValues(`${name}`) as any;
  const onNext = () => null;
  const onSkip = () => null;
  const subtype = props.subtype as keyof typeof taskBits;

  const { Task, TaskSchema } = taskBits[subtype];

  if (Task) {
    const result = TaskSchema.safeParse(props);
    if (result.success) {
      // TODO evaluate locally if possible
      return (
        <TaskShell
          header="Preview"
          mode="default"
          onNext={onNext}
          onSkip={onSkip}
          task={result.data}
          TaskComponent={Task as any}
        />
      );
    } else {
      return <div>{t("bit-type-properties-invalid")}</div>;
    }
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

export const TaskPropertiesSidebar = ({ name }: { name: string }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <Tabs>
        <Tab active={activeTab === 0} onClick={() => setActiveTab(0)}>
          {t("meta")}
        </Tab>
        <Tab active={activeTab === 1} onClick={() => setActiveTab(1)}>
          {t("view")}
        </Tab>
        <Tab active={activeTab === 2} onClick={() => setActiveTab(2)}>
          {t("evaluation")}
        </Tab>
        <Tab active={activeTab === 3} onClick={() => setActiveTab(3)}>
          {t("feedback")}
        </Tab>
        <Tab active={activeTab === 4} onClick={() => setActiveTab(4)}>
          {t("preview")}
        </Tab>
      </Tabs>
      <TabPanel index={0} value={activeTab}>
        <MetaForm name={name} />
      </TabPanel>
      <TabPanel index={1} value={activeTab}>
        <ViewForm name={name} />
      </TabPanel>
      <TabPanel index={2} value={activeTab}>
        <EvaluationForm name={name} />
      </TabPanel>
      <TabPanel index={3} value={activeTab}>
        <FeedbackForm name={name} />
      </TabPanel>
      <TabPanel index={4} value={activeTab}>
        <Preview name={name} />
      </TabPanel>
    </Fragment>
  );
};
