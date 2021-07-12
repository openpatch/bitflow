import { Flow } from "@bitflow/core";
import { useBitInput } from "@bitflow/provider";
import { InputShell } from "@bitflow/shell";
import {
  HookFormController,
  Input,
  MarkdownEditor,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment, useState } from "react";
import { useFormContext } from "react-hook-form";
import translations from "./locales.vocab";
import { TabContainer } from "./TabContainer";

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
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);

  const subtype = getValues(`${name}.subtype`) as any;

  const inputBit = useBitInput(subtype);

  if (inputBit) {
    return <inputBit.ViewForm name={name} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);

  const props = getValues(`${name}`) as any;
  const onNext = async () => {};
  const subtype = props.subtype as any;
  const inputBit = useBitInput(subtype);
  if (inputBit) {
    const result = inputBit.InputSchema.safeParse(props);
    if (result.success) {
      return (
        <InputShell
          InputComponent={inputBit.Input}
          input={result.data}
          onNext={onNext}
          header={t("preview")}
        />
      );
    } else {
      return <div>{t("bit-type-properties-invalid")}</div>;
    }
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

export const InputPropertiesSidebar = ({ name }: { name: string }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <Tabs>
        <TabList inverted tone="neutral">
          <Tab>{t("meta")}</Tab>
          <Tab>{t("view")}</Tab>
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
            <Preview name={name} />
          </TabPanel>
        </TabContainer>
      </Tabs>
    </Fragment>
  );
};
