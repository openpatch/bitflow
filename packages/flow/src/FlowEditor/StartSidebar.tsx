import { HookFormController, Input, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment, useState } from "react";
import { useFormContext } from "react-hook-form";
import translations from "../locales.vocab";
import { IFlow, StartSchema } from "../schemas";
import { StartShell } from "../StartShell";
import { Tab, TabPanel, Tabs } from "./Tabs";

const ViewForm = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.title`}
        label={t("start-title")}
        defaultValue=""
        render={Input}
      />
      <HookFormController
        name={`${name}.view.markdown`}
        label={t("start-markdown")}
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

const Preview = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<IFlow>();
  const { t } = useTranslations(translations);

  const props = getValues(`${name}` as any) as any;
  const test = StartSchema.safeParse(props);
  const onNext = () => null;
  if (test.success) {
    return <StartShell start={test.data} onNext={onNext} />;
  } else {
    return <div>{t("start-properties-invalid")}</div>;
  }
};

export const StartPropertiesSidebar = ({ name }: { name: string }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <Tabs>
        <Tab active={activeTab === 0} onClick={() => setActiveTab(0)}>
          {t("view")}
        </Tab>
        <Tab active={activeTab === 1} onClick={() => setActiveTab(1)}>
          {t("preview")}
        </Tab>
      </Tabs>
      <TabPanel index={0} value={activeTab}>
        <ViewForm name={name} />
      </TabPanel>
      <TabPanel index={1} value={activeTab}>
        <Preview name={name} />
      </TabPanel>
    </Fragment>
  );
};
