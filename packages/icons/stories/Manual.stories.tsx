import { IconProps } from "@openpatch/patches/.";
import { Meta, Story } from "@storybook/react/types-6-0";
import { ManualIcon } from "../src";
export default {
  title: "Icons/Manual",
  argTypes: {},
} as Meta;

export const Manual: Story<IconProps> = (props) => <ManualIcon {...props} />;
