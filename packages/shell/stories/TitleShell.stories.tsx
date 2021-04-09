import { ITitle, Title } from "@bitflow/title-simple";
import { Box } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { TitleShell, TitleShellProps } from "../src/TitleShell";

export default {
  title: "Shells/Title",
  argTypes: {},
} as Meta;

const props: TitleShellProps<ITitle> = {
  TitleComponent: Title,
  header: "Title",
  title: {
    description: "",
    name: "",
    subtype: "simple",
    view: {
      title: "Super Microassessment",
      message: `Lorem ipsum dolor sit amet, *consectetur* adipisicing elit, sed do eiusmod
tempor incididunt ut **labore et dolore magna aliqua**. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. ***Duis aute irure dolor*** in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. ~~Excepteur sint occaecat~~ cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    },
  },
  onNext: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("next");
        resolve();
      }, 1000);
    }),
};

export const Default: Story<TitleShellProps<ITitle>> = (args) => (
  <Box height="400px" width="100vw">
    <TitleShell {...props} {...args} />
  </Box>
);
