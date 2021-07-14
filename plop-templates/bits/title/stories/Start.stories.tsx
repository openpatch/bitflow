import { Meta } from "@storybook/react/types-6-0";
import { Title } from "../src/Title";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/Title/{{ properCase name }}/Title",
  component: Title,
  argTypes: {},
} as Meta;

export const Example = () => {
  const { example } = useInformation();

  return <Title title={example} />;
};
