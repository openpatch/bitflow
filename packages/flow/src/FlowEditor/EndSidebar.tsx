import { HookFormController, MarkdownEditor } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import React, { Fragment, useState } from "react";
import { useFormContext } from "react-hook-form";
import { EndShell } from "../EndShell";
import translations from "../locales.vocab";
import { EndSchema, IFlow } from "../schemas";
import { Tab, TabPanel, Tabs } from "./Tabs";

const ViewForm = ({ name }: { name: string }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.markdown`}
        label={t("end-markdown")}
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

  const props = getValues(`${name}`) as any;
  const test = EndSchema.safeParse(props);
  if (test.success) {
    return (
      <EndShell
        end={test.data}
        points={test.data.view.showPoints ? 10 : undefined}
      />
    );
  } else {
    return <div>{t("end-properties-invalid")}</div>;
  }
};

export const EndPropertiesSidebar = ({ name }: { name: string }) => {
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
