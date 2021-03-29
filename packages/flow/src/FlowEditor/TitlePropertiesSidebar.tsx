import { titleBits } from "@bitflow/bits";
import { TitleShell } from "@bitflow/shell";
import { HookFormController, Input, MarkdownEditor } from "@openpatch/patches";
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

  const subtype = getValues(`${name}.subtype`) as keyof typeof titleBits;

  const { ViewForm } = titleBits[subtype];

  if (ViewForm) {
    return <ViewForm name={name} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<IFlow>();
  const { t } = useTranslations(translations);

  const props = getValues(`${name}`) as any;
  const onNext = () => null;
  const subtype = props.subtype as keyof typeof titleBits;
  const { Title, TitleSchema } = titleBits[subtype];
  if (Title) {
    const test = TitleSchema.safeParse(props);
    if (test.success) {
      return (
        <TitleShell
          TitleComponent={Title}
          title={props as any} // TODO proper types
          onNext={onNext}
        />
      );
    } else {
      return <div>{t("bit-type-properties-invalid")}</div>;
    }
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

export const TitlePropertiesSidebar = ({ name }: { name: string }) => {
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
        <Preview name={name} />
      </TabPanel>
    </Fragment>
  );
};
