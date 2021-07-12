import { FormLabel, Input } from "@openpatch/patches";
import { useState } from "react";
import { ConceptModelEditorProps } from "./ConceptModelEditor";
import { HeaderSidebar } from "./HeaderSidebar";
import { PropertiesSidebarProps } from "./PropertiesSidebar";

export type LatentVariablePropertiesSidebarProps = {
  node: ConceptModelEditorProps["latentVariables"][0];
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
