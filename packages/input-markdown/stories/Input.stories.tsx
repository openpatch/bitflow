import { Meta } from "@storybook/react/types-6-0";
import { Input, useInformation } from "../src";

export default {
  title: "Bits/Input/Tries/Input",
  component: Input,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <Input input={example} />;
};
