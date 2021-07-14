import { generateDoResult } from "@bitflow/mock";
import { Meta } from "@storybook/react/types-6-0";
import { End } from "../src/End";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/End/{{ properCase name }}/End",
  component: End,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <End end={example} getResult={generateDoResult} />;
};
