import { IconProps } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { CorrectIcon } from "../src";
export default {
  title: "Icons/Correct",
  argTypes: {},
} as Meta;

export const Correct: Story<IconProps> = (props) => <CorrectIcon {...props} />;
