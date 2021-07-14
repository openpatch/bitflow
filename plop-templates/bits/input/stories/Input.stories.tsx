import { Meta } from "@storybook/react/types-6-0";
import { Input } from "../src/Input";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/Input/{{ properCase name }}/Input",
  component: Input,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <Input input={example} />;
};
