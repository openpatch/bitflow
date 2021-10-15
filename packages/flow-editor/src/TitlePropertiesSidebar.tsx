import { Flow } from "@bitflow/core";
import { useBitTitle } from "@bitflow/provider";
import { TitleShell } from "@bitflow/shell";
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
  const node = getValues(`${name}`);

  if (node.type !== "title") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const titleBit = useBitTitle(node.data.subtype);

  if (titleBit) {
    return <titleBit.ViewForm name={`${name}.data`} />;
  }

  return <div>{t("bit-type-unsupported")}</div>;
};

const Preview = ({ name }: { name: `nodes.${number}` }) => {
  const { getValues } = useFormContext<Flow>();
  const { t } = useTranslations(translations);
  const node = getValues(`${name}`);
  if (node.type !== "title") {
    return <div>{t("bit-type-unsupported")}</div>;
  }

  const onNext = async () => {};
  const subtype = node.data.subtype;
  const titleBit = useBitTitle(subtype);

  if (titleBit) {
    return (
      <TitleShell
        TitleComponent={titleBit.Title}
        title={node.data}
        header={t("title")}
        onNext={onNext}
      />
    );
  } else {
    return <div>{t("bit-type-unsupported")}</div>;
  }
};

export const TitlePropertiesSidebar = ({
  name,
}: {
  name: `nodes.${number}`;
}) => {
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
