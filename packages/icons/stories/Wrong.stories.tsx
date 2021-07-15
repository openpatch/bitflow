import { IconProps } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { WrongIcon } from "../src";
export default {
  title: "Icons/Wrong",
  argTypes: {},
} as Meta;

export const Wrong: Story<IconProps> = (props) => <WrongIcon {...props} />;
