import { Meta } from "@storybook/react/types-6-0";
import { Start } from "../src/Start";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/Start/{{ properCase name }}/Start",
  component: Start,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <Start start={example} />;
};
