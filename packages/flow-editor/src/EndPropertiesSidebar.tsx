import { Flow, FlowNode } from "@bitflow/core";
import { useBitEnd } from "@bitflow/provider";
import { EndShell } from "@bitflow/shell";
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

const ViewForm = ({ name }: { name: `nodes.${number}` }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);

  // @ts-ignore
  const node = getValues(name) as FlowNode;
  if (node.type !== "end") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const endBit = useBitEnd(node.data.subtype);

  if (endBit) {
    return <endBit.ViewForm name={`${name}.data`} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({ name }: { name: `nodes.${number}` }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);

  const node = getValues(name);
  if (node.type !== "end") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const endBit = useBitEnd(node.data.subtype);

  if (endBit) {
    return (
      <EndShell
        header="Preview"
        getResult={async () => ({
          maxPoints: 5,
          points: 2,
          startDate: new Date(),
          endDate: new Date(),
          tries: [],
        })}
        onNext={async () => {}}
        end={node.data}
        EndComponent={endBit.End}
      />
    );
  }
  return <div>{t("bit-type-unsupported")}</div>;
};

export const EndPropertiesSidebar = ({ name }: { name: `nodes.${number}` }) => {
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
