import { IInput, Input } from "@bitflow/input-markdown";
import { Box } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { InputShell, InputShellProps } from "../src/InputShell";

export default {
  title: "Shells/Input",
  argTypes: {},
} as Meta;

const props: InputShellProps<IInput> = {
  header: "Input",
  InputComponent: Input,
  progress: {
    value: 5,
    max: 10,
  },
  input: {
    description: "",
    name: "",
    subtype: "markdown",
    view: {
      markdown: `# H1
Lorem ipsum dolor sit amet, *consectetur* adipisicing elit, sed do eiusmod
tempor incididunt ut **labore et dolore magna aliqua**. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. ***Duis aute irure dolor*** in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. ~~Excepteur sint occaecat~~ cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## H2

Lorem ipsum dolor sit amet, *consectetur* adipisicing elit, sed do eiusmod
tempor incididunt ut **labore et dolore magna aliqua**. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. 

---

***Duis aute irure dolor*** in reprehenderit in voluptate velit esse
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
  onClose: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("close");
        resolve();
      }, 1000);
    }),
  onPrevious: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("previous");
        resolve();
      }, 1000);
    }),
};

export const Default: Story<InputShellProps<IInput>> = (args) => (
  <Box height="100vh" width="100vw">
    <InputShell {...props} {...args} />
  </Box>
);
