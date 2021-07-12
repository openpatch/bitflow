import { Box } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { FlowEditor, FlowEditorProps } from "../src/FlowEditor";

export default {
  title: "Flow/FlowEditor",
  component: FlowEditor,
  argTypes: {
    onSubmit: {
      action: "submit",
    },
    onError: {
      action: "error",
    },
  },
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
} as Meta;

export const Default: Story<FlowEditorProps> = (args) => (
  <Box width="100vw" height="100vh">
    <FlowEditor
      height="100vh"
      onSubmit={args.onSubmit}
      onError={args.onError}
    />
  </Box>
);
