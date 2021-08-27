import { Meta, Story } from "@storybook/react/types-6-0";
import { FlowNode, FlowNodeProps } from "../src/FlowNode";

export default {
  title: "Flow/FlowNode",
  component: FlowNode,
  argTypes: {},
} as Meta;

export const Default: Story<FlowNodeProps> = (args) => {
  return <FlowNode title="Hallo" count={8} />;
};
