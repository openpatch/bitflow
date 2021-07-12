import { Meta } from "@storybook/react/types-6-0";
import { Title, useInformation } from "../src";

export default {
  title: "Bits/Title/Simple/Title",
  component: Title,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <Title title={example} />;
};
