import { Meta } from "@storybook/react/types-6-0";
import { Statistic } from "../src/Statistic";

export default {
  title: "Bits/Task/Input/Statistic",
  component: Statistic,
  argTypes: {},
} as Meta;

export const Default = () => (
  <Statistic
    statistic={{
      subtype: "input",
      count: 5,
      inputs: {
        foo: {
          count: 5,
          correct: true,
        },
        bar: {
          count: 10,
          correct: false,
        },
        class: {
          count: 12,
          correct: false,
        },
        public: {
          count: 4,
          correct: false,
        },
        test: {
          count: 1,
          correct: false,
        },
        private: {
          count: 8,
          correct: false,
        },
        "this is a longer sentence which could happen": {
          count: 1,
          correct: false
        },
        "and another long sentence": {
          count: 1,
          correct: false
        },
        "another long sentence": {
          count: 1,
          correct: false
        }
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
