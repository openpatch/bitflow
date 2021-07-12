import { Flow } from "@bitflow/core";
import { useBitStart } from "@bitflow/provider";
import { StartShell } from "@bitflow/shell";
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
import { Fragment } from "react";
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
  const startBit = useBitStart(subtype);

  if (startBit) {
    return <startBit.ViewForm name={name} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({ name }: { name: string }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);
  const props = getValues(`${name}`) as any;
  const subtype = props.subtype;
  const startBit = useBitStart(subtype);

  if (startBit) {
    const result = startBit.StartSchema.safeParse(props);
    if (result.success) {
      return (
        <StartShell
          header="Preview"
          onNext={async () => {}}
          start={result.data}
          StartComponent={startBit.Start}
        />
      );
    } else {
      return <div>{t("bit-type-properties-invalid")}</div>;
    }
  }
  return <div>{t("bit-type-unsupported")}</div>;
};

export const StartPropertiesSidebar = ({ name }: { name: string }) => {
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
