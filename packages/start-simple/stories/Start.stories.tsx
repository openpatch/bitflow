import { Meta } from "@storybook/react/types-6-0";
import { Start, useInformation } from "../src";

export default {
  title: "Bits/Start/Tries/Start",
  component: Start,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <Start start={example} />;
};
