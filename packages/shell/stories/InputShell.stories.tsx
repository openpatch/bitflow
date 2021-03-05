import { Story, Meta } from "@storybook/react/types-6-0";
import { IInputMarkdown, InputMarkdown } from "@openpatch/bits-input-markdown";
import { InputShell, InputShellProps } from "../src/InputShell";

export default {
  title: "Shells/Input",
  argTypes: {
    onNext: { action: "next" },
  },
} as Meta;

const props: InputShellProps<IInputMarkdown> = {
  title: "Input",
  InputComponent: InputMarkdown,
  progress: {
    value: 5,
    max: 10,
  },
  input: {
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
  onNext: console.log,
};

export const Default: Story<InputShellProps<IInputMarkdown>> = (args) => (
  <InputShell {...props} {...args} />
);
