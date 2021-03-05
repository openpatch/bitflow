import { Meta } from "@storybook/react/types-6-0";
import { Statistic } from "../src/Statistic";

export default {
  title: "Tasks/Multiple Choice/Statistic",
  component: Statistic,
  argTypes: {},
} as Meta;

export const Default = () => (
  <Statistic
    statistic={{
      count: 5,
      patterns: {
        ab: { count: 4 },
        a: { count: 2 },
        abc: { count: 7 },
      },
    }}
    task={{
      title: "Title",
      variant: "multiple",
      instruction: "Select an answer",
      choices: [{ markdown: "A" }, { markdown: "B" }, { markdown: "C" }],
    }}
  />
);
