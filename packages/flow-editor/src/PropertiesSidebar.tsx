import { FlowNode } from "@bitflow/core";
import { useTranslations } from "@vocab/react";
import { Fragment, ReactElement } from "react";
import { CenterSidebar } from "./CenterSidebar";
import { EndPropertiesSidebar } from "./EndPropertiesSidebar";
import { FlowPropertiesSidebar } from "./FlowPropertiesSidebar";
import { InputPropertiesSidebar } from "./InputPropertiesSidebar";
import translations from "./locales.vocab";
import { PortalInputPropertiesSidebar } from "./PortalInputPropertiesSidebar";
import { PortalOutputPropertiesSidebar } from "./PortalOutputPropertiesSidebar";
import { SplitAnswerPropertiesSidebar } from "./SplitAnswerPropertiesSidebar";
import { SplitPointsPropertiesSidebar } from "./SplitPointsPropertiesSidebar";
import { SplitResultPropertiesSidebar } from "./SplitResultPropertiesSidebar";
import { StartPropertiesSidebar } from "./StartPropertiesSidebar";
import { TaskPropertiesSidebar } from "./TaskPropertiesSidebar";
import { TitlePropertiesSidebar } from "./TitlePropertiesSidebar";

export type PropertiesSidebarProps = { node?: FlowNode; nodeIndex?: number };

export const PropertiesSidebar = ({
  node,
  nodeIndex,
}: PropertiesSidebarProps) => {
  const { t } = useTranslations(translations);
  if (!node || nodeIndex === undefined) {
    return <FlowPropertiesSidebar />;
  }
  let content: ReactElement = (
    <CenterSidebar>{t("node-no-properties")}</CenterSidebar>
  );

  const name = `nodes.[${nodeIndex}].data`;
  switch (node.type) {
    case "task": {
      content = <TaskPropertiesSidebar name={name} />;
      break;
    }
    case "title": {
      content = <TitlePropertiesSidebar name={name} />;
      break;
    }
    case "input": {
      content = <InputPropertiesSidebar name={name} />;
      break;
    }
    case "portal-input": {
      content = <PortalInputPropertiesSidebar name={name} />;
      break;
    }
    case "portal-output": {
      content = <PortalOutputPropertiesSidebar name={name} />;
      break;
    }
    case "start": {
      content = <StartPropertiesSidebar name={name} />;
      break;
    }
    case "end": {
      content = <EndPropertiesSidebar name={name} />;
      break;
    }
    case "split-points": {
      content = <SplitPointsPropertiesSidebar name={name} />;
      break;
    }
    case "split-answer": {
      content = <SplitAnswerPropertiesSidebar name={name} />;
      break;
    }
    case "split-result": {
      content = <SplitResultPropertiesSidebar name={name} />;
      break;
    }
  }
  return <Fragment>{content}</Fragment>;
};
