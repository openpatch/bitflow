import { Box } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { proceduralC as flow } from "../../../website/src/flows/proceduralC";
import {
  ConceptModelEditor,
  ConceptModelEditorProps,
} from "../src/ConceptModelEditor";

export default {
  title: "ConceptModel/ConceptModelEditor",
  component: ConceptModelEditor,
  argTypes: {
    onSave: {
      action: "save",
    },
  },
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
} as Meta;

export const Default: Story<ConceptModelEditorProps> = (args) => (
  <Box width="100vw" height="100vh">
    <ConceptModelEditor
      {...args}
      height="100vh"
      nodes={
        flow.nodes
          .filter((n) => n.type === "task")
          .map((n) => ({ ...n, type: "manifest-task" })) as any
      }
      edges={[]}
      latentVariables={[
        {
          id: "lv1",
          position: { x: 1, y: 1 },
          type: "latent-variable",
          data: {
            title: "Control Structures",
            alpha: 0.4,
            mean: 4,
          },
        },
      ]}
    />
  </Box>
);
