import { Meta, Story } from "@storybook/react/types-6-0";
import { useInformation } from "../src";
import { Statistic } from "../src/Statistic";

export default {
  title: "Bits/Task/YesNo/Statistic",
  component: Statistic,
} as Meta;

export const Default: Story = (args) => {
  const { example } = useInformation();
  return (
    <Statistic
      task={example}
      statistic={{ count: 200, no: 50, yes: 150, subtype: "yes-no" }}
    />
  );
};
