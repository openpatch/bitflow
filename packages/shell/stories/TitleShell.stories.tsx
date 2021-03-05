import { Story, Meta } from "@storybook/react/types-6-0";
import { ITitleSimple, TitleSimple } from "@openpatch/bits-title-simple";
import { TitleShell, TitleShellProps } from "../src/TitleShell";

export default {
  title: "Shells/Title",
  argTypes: {
    onNext: { action: "next" },
  },
} as Meta;

const props: TitleShellProps<ITitleSimple> = {
  TitleComponent: TitleSimple,
  title: {
    title: "Super Microassessment",
    message: `Lorem ipsum dolor sit amet, *consectetur* adipisicing elit, sed do eiusmod
tempor incididunt ut **labore et dolore magna aliqua**. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. ***Duis aute irure dolor*** in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. ~~Excepteur sint occaecat~~ cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  },
  onNext: console.log,
};

export const Default: Story<TitleShellProps<ITitleSimple>> = (args) => (
  <TitleShell {...props} {...args} />
);
