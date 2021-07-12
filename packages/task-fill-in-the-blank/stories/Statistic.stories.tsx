import { Meta } from "@storybook/react/types-6-0";
import { Statistic } from "../src/Statistic";

export default {
  title: "Bits/Task/Fill in the blank/Statistic",
  component: Statistic,
  argTypes: {},
} as Meta;

export const Default = () => (
  <Statistic
    statistic={{
      subtype: "fill-in-the-blank",
      count: 5,
      blanks: {
        a: {
          hallo: {
            correct: false,
            count: 20,
          },
          bla: {
            correct: false,
            count: 25,
          },
        },
        b: {
          hu: {
            correct: true,
            count: 10,
          },
        },
      },
    }}
    task={{
      name: "Hallo",
      subtype: "fill-in-the-blank",
      description: "Desc",
      view: {
        instruction: "Select an answer",
        textWithBlanks: `
~~a~~ with another blank ~~b~~
        `,
      },
      evaluation: {
        enableRetry: false,
        blanks: {
          a: "Hallo",
          b: "Hu",
        },
        mode: "auto",
        showFeedback: false,
      },
      feedback: {
        blanks: {
          a: {
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
        },
      },
    }}
  />
);
