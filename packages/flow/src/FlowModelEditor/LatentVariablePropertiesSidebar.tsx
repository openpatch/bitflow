import { FormLabel, Input } from "@openpatch/patches";
import { useState } from "react";
import { HeaderSidebar } from "../FlowEditor/HeaderSidebar";
import { FlowModelEditorProps } from "./FlowModelEditor";
import { PropertiesSidebarProps } from "./PropertiesSidebar";

export type LatentVariablePropertiesSidebarProps = {
  node: FlowModelEditorProps["latentVariables"][0];
  setNode: PropertiesSidebarProps["setNode"];
};

export const LatentVariablePropertiesSidebar = ({
  node,
  setNode,
}: LatentVariablePropertiesSidebarProps) => {
  const [title, setTitle] = useState(node.data.title || "");

  return (
    <HeaderSidebar header="Concept Properties">
      <FormLabel htmlFor="title">Title</FormLabel>
      <Input
        id="title"
        value={title}
        onChange={setTitle}
        onBlur={() => setNode(node.id, { data: { title } })}
      />
    </HeaderSidebar>
  );
};
