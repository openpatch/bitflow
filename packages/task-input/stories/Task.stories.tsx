import { TaskProps, TaskRef } from "@bitflow/core";
import { Meta, Story } from "@storybook/react/types-6-0";
import { useEffect, useRef } from "react";
import { Task } from "../src/Task";
import { IAction, IAnswer, IResult, ITask } from "../src/types";

export default {
  title: "Bits/Task/Input/Task",
  component: Task,
  argTypes: {},
} as Meta;

type TTaskProps = TaskProps<ITask, IResult, IAnswer, IAction>;

const Template: Story<TTaskProps> = (args) => <Task {...args} />;

export const Default = Template.bind({});
Default.args = {
  mode: "default",
  onChange: console.log,
  task: {
    subtype: "input",
    view: {
      instruction: "**This is an instruction**",
    },
  },
} as TTaskProps;

export const Result = Template.bind({});
Result.args = {
  mode: "result",
  task: {
    subtype: "input",
    view: {
      instruction: "",
    },
  },
  onChange: console.log,
  result: {
    state: "wrong",
    feedback: [
      {
        message: "You should have selected bar",
        severity: "error",
      },
    ],
  },
  answer: {
    input: "foo",
  },
} as TTaskProps;

export const Recording: Story<TaskProps<ITask, IResult, IAnswer, IAction>> = (
  args
) => {
  const ref = useRef<TaskRef<IAction>>(null);
  const actions = useRef<IAction[]>([
    {
      type: "change",
      payload: {
        input: "Hi",
      },
    },
    {
      type: "change",
      payload: {
        input: "How are you?",
      },
    },
    {
      type: "change",
      payload: {
        input: "See you!",
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
        subtype: "input",
        view: {
          instruction: "Input an answers which works",
        },
      }}
      onChange={console.log}
      ref={ref}
    />
  );
};
