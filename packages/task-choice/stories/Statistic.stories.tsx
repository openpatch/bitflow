import { Meta } from "@storybook/react/types-6-0";
import { Statistic } from "../src/Statistic";

export default {
  title: "Bits/Task/Multiple Choice/Statistic",
  component: Statistic,
  argTypes: {},
} as Meta;

export const Default = () => (
  <Statistic
    statistic={{
      subtype: "choice",
      count: 5,
      patterns: {
        ab: { count: 4, correct: true },
        a: { count: 2, correct: false },
        abc: { count: 7, correct: false },
        cb: { count: 7, correct: false },
      },
    }}
    task={{
      subtype: "choice",
      name: "Hallo",
      description: "Desc",
      view: {
        variant: "multiple",
        instruction: "Select an answer",
        choices: [{ markdown: "#A yo" }, { markdown: "!B **test**" }, { markdown: "C" }],
      },
      evaluation: {
        correct: [],
        enableRetry: false,
        mode: "auto",
        showFeedback: false,
      },
      feedback: {
        choices: {},
        patterns: {},
      },
    }}
  />
);
