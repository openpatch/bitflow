import { FlowModelEditorProps } from "./FlowModelEditor";
import { LatentVariablePropertiesSidebar } from "./LatentVariablePropertiesSidebar";

export type PropertiesSidebarProps = {
  node?: FlowModelEditorProps["latentVariables"][0];
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
