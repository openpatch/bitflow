import { Box } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { proceduralC } from "../../../website/src/flows/proceduralC";
import { DoLocal, DoLocalProps } from "../src/DoLocal";

export default {
  title: "DoLocal",
  component: DoLocal,
  argTypes: {},
} as Meta;

export const Default: Story<DoLocalProps> = () => {
  return (
    <Box height="100vh">
      <DoLocal flow={proceduralC} />
    </Box>
  );
};
