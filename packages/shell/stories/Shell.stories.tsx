import { Meta } from "@storybook/react/types-6-0";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "../src";

export default {
  title: "Shells/Shell",
  argTypes: {},
} as Meta;

export const Unset = () => (
  <Shell position="unset">
    <ShellHeader>Header</ShellHeader>
    <ShellContent>Content</ShellContent>
    <ShellFooter>Footer</ShellFooter>
  </Shell>
);
