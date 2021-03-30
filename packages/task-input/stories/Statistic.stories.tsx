import { Meta } from "@storybook/react/types-6-0";
import { Statistic } from "../src/Statistic";

export default {
  title: "Tasks/Input/Statistic",
  component: Statistic,
  argTypes: {},
} as Meta;

export const Default = () => (
  <Statistic
    statistic={{
      count: 5,
      inputs: {
        foo: {
          count: 1,
          correct: true,
        },
        bar: {
          count: 1,
          correct: false,
        },
      },
      patterns: {
        foo: {
          count: 1,
        },
      },
    }}
    task={{
      subtype: "input",
      name: "Hallo",
      description: "Desc",
      view: {
        instruction: "Select an answer",
      },
      evaluation: {
        enableRetry: false,
        pattern: "foo|bar",
        mode: "auto",
        showFeedback: false,
      },
      feedback: {
        patterns: [
          {
            feedback: {
              message: "you selected foo",
              severity: "error",
            },
            pattern: "foo",
          },
        ],
      },
    }}
  />
);
