import { Story, Meta } from "@storybook/react/types-6-0";
import {
  IPrivacyMarkdown,
  PrivacyMarkdown,
} from "@openpatch/bits-privacy-markdown";
import { PrivacyShell, PrivacyShellProps } from "../src/PrivacyShell";

export default {
  title: "Shells/Privacy",
  argTypes: {
    onNext: { action: "next" },
  },
} as Meta;

const props: PrivacyShellProps<IPrivacyMarkdown> = {
  title: "Privacy",
  PrivacyComponent: PrivacyMarkdown,
  privacy: {
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

export const Default: Story<PrivacyShellProps<IPrivacyMarkdown>> = (args) => (
  <PrivacyShell {...props} {...args} />
);
