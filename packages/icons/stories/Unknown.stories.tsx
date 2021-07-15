import { IconProps } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { UnknownIcon } from "../src";
export default {
  title: "Icons/Unknown",
  argTypes: {},
} as Meta;

export const Unknown: Story<IconProps> = (props) => <UnknownIcon {...props} />;
