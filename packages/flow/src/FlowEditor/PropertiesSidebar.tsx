import { useTranslations } from "@vocab/react";
import { Fragment, ReactElement } from "react";
import translations from "../locales.vocab";
import { IFlowNode } from "../schemas";
import { CenterSidebar } from "./CenterSidebar";
import { EndPropertiesSidebar } from "./EndSidebar";
import { FlowPropertiesSidebar } from "./FlowPropertiesSidebar";
import { InputPropertiesSidebar } from "./InputPropertiesSidebar";
import { SplitAnswerPropertiesSidebar } from "./SplitAnswerPropertiesSidebar";
import { SplitPointsPropertiesSidebar } from "./SplitPointsPropertiesSidebar";
import { SplitResultPropertiesSidebar } from "./SplitResultPropertiesSidebar";
import { StartPropertiesSidebar } from "./StartSidebar";
import { TaskPropertiesSidebar } from "./TaskPropertiesSidebar";
import { TitlePropertiesSidebar } from "./TitlePropertiesSidebar";

export type PropertiesSidebarProps = { node?: IFlowNode; nodeIndex?: number };

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
