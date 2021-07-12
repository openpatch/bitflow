import { ConceptModelEditorProps } from "./ConceptModelEditor";
import { LatentVariablePropertiesSidebar } from "./LatentVariablePropertiesSidebar";

export type PropertiesSidebarProps = {
  node?: ConceptModelEditorProps["latentVariables"][0];
  setNode: (id: string, node: Partial<PropertiesSidebarProps["node"]>) => void;
};

export const PropertiesSidebar = ({
  node,
  setNode,
}: PropertiesSidebarProps) => {
  switch (node?.type) {
    case "latent-variable": {
      return <LatentVariablePropertiesSidebar node={node} setNode={setNode} />;
    }
  }

  return <div />;
};
