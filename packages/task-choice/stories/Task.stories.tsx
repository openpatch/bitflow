import { TaskProps, TaskRef } from "@bitflow/core";
import { Meta, Story } from "@storybook/react/types-6-0";
import { useEffect, useRef } from "react";
import { Task } from "../src/Task";
import { IAction, IAnswer, IResult, ITask } from "../src/types";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/Task/Multiple Choice/Task",
  component: Task,
  argTypes: {
    onChange: {
      action: "change",
    },
    onAction: {
      action: "action",
    },
  },
} as Meta;

export const Example: Story = (args) => {
  const { example } = useInformation();

  return (
    <Task
      mode="default"
      task={example}
      onChange={args.onChange}
      onAction={args.onAction}
    />
  );
};

export const Answer: Story = (args) => {
  const { example } = useInformation();
  return (
    <Task
      task={example}
      mode="result"
      onChange={args.onChange}
      answer={{
        subtype: "choice",
        checked: {
          a: true,
        },
      }}
    />
  );
};

export const Result: Story = (args) => {
  const { example } = useInformation();
  return (
    <Task
      task={example}
      mode="result"
      onChange={args.onChange}
      answer={{
        subtype: "choice",
        checked: {
          a: true,
        },
      }}
      result={{
        subtype: "choice",
        state: "correct",
        choices: {
          a: {
            state: "wrong",
            feedback: {
              message: "A feedback for a choice",
              severity: "info",
            },
          },
          b: {
            state: "neutral",
          },
          c: {
            state: "correct",
          },
          d: {
            state: "correct",
          },
        },
        feedback: {
          message: "This is a feedback",
          severity: "error",
        },
      }}
    />
  );
};

export const Recording: Story<TaskProps<ITask, IResult, IAnswer, IAction>> = (
  args
) => {
  const ref = useRef<TaskRef<IAction>>(null);
  const actions = useRef<IAction[]>([
    {
      type: "check",
      payload: {
        choice: "a",
        variant: "single",
      },
    },
    {
      type: "check",
      payload: {
        choice: "d",
        variant: "single",
      },
    },
    {
      type: "check",
      payload: {
        choice: "b",
        variant: "single",
      },
    },
    {
      type: "check",
      payload: {
        choice: "c",
        variant: "single",
      },
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextAction = actions.current.pop();
      if (nextAction && ref.current) {
        ref.current.dispatch(nextAction);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Task
      mode="recording"
      task={{
        subtype: "choice",
        view: {
          instruction: "Select all answers which work",
          variant: "single",
          choices: [
            { markdown: "Answer A" },
            { markdown: "Answer B" },
            { markdown: "Answer C" },
            { markdown: "Answer D" },
          ],
        },
      }}
      onChange={console.log}
      ref={ref}
    />
  );
};
