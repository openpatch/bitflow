import { IPrivacy, Privacy } from "@bitflow/privacy-markdown";
import { Meta, Story } from "@storybook/react/types-6-0";
import { PrivacyShell, PrivacyShellProps } from "../src/PrivacyShell";

export default {
  title: "Shells/Privacy",
  argTypes: {},
} as Meta;

const props: PrivacyShellProps<IPrivacy> = {
  header: "Privacy",
  PrivacyComponent: Privacy,
  privacy: {
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
};

export const Default: Story<PrivacyShellProps<IPrivacy>> = (args) => (
  <PrivacyShell {...props} {...args} />
);
