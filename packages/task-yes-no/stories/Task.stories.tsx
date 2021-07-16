import { TaskRef } from "@bitflow/core";
import { Meta, Story } from "@storybook/react/types-6-0";
import { useEffect, useRef } from "react";
import { IAction } from "../src";
import { Task } from "../src/Task";
import { useInformation } from "../src/useInformation";

export default {
  title: "Bits/Task/YesNo/Task",
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
        subtype: "yes-no",
        yes: true,
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
      result={{
        subtype: "yes-no",
        state: "wrong",
        feedback: {
          message: "A simple feedback",
          severity: "error",
        },
      }}
    />
  );
};

export const Recording: Story = (args) => {
  const { example } = useInformation();
  const ref = useRef<TaskRef<IAction>>(null);
  const actions = useRef<IAction[]>([
    {
      type: "yes",
    },
    {
      type: "no",
    },
    {
      type: "yes",
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
  });

  return (
    <Task mode="recording" task={example} onChange={args.onChange} ref={ref} />
  );
};
