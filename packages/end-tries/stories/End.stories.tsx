import { generateDoResult } from "@bitflow/mock";
import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import { End, useInformation } from "../src";

export default {
  title: "Bits/End/Tries/End",
  component: End,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return (
    <Box width="100vw" height="100vh">
      <End end={example} getResult={generateDoResult} />
    </Box>
  );
};
