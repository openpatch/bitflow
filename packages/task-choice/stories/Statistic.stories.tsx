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
        ab: { count: 4, correct: true },
        a: { count: 2, correct: false },
        abc: { count: 7, correct: false },
      },
    }}
    task={{
      id: "a-id",
      type: "task",
      subtype: "choice",
      name: "Hallo",
      description: "Desc",
      view: {
        variant: "multiple",
        instruction: "Select an answer",
        choices: [{ markdown: "A" }, { markdown: "B" }, { markdown: "C" }],
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
