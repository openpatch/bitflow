import { TaskProps, TaskRef } from "@bitflow/core";
import { Meta, Story } from "@storybook/react/types-6-0";
import { useEffect, useRef } from "react";
import { Task } from "../src/Task";
import { IAction, IAnswer, IResult, ITask } from "../src/types";

export default {
  title: "Bits/Task/Fill in the blank/Task",
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
    subtype: "fill-in-the-blank",
    view: {
      instruction: "**This is an instruction**",
      textWithBlanks: `
~~A~~ a test ~~B~~
\`\`\`java
public ~~B~~ static void main {
  String bla = "";
}
\`\`\`
`,
    },
  },
};

export const Result = Template.bind({});
Result.args = {
  mode: "result",
  task: {
    subtype: "fill-in-the-blank",
    view: {
      instruction: "",
      textWithBlanks: `
~~A~~ a test ~~C~~
\`\`\`
public ~~B~~ static void main {
  String bla = "";
}
\`\`\`
`,
    },
  },
  onChange: console.log,
  result: {
    subtype: "fill-in-the-blank",
    blanks: {
      A: {
        state: "wrong",
      },
    },
    state: "correct",
    feedback: [
      {
        message: "You should have selected bar",
        severity: "error",
      },
    ],
  },
  answer: {
    subtype: "fill-in-the-blank",
    blanks: {
      A: "Hallo",
    },
  },
};

export const Recording: Story<TaskProps<ITask, IResult, IAnswer, IAction>> = (
  args
) => {
  const ref = useRef<TaskRef<IAction>>(null);
  const actions = useRef<IAction[]>([
    {
      type: "change-blank",
      payload: {
        value: "Hi",
        blank: "A",
      },
    },
    {
      type: "change-blank",
      payload: {
        value: "How are you?",
        blank: "A",
      },
    },
    {
      type: "change-blank",
      payload: {
        value: "See you!",
        blank: "A",
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
        subtype: "fill-in-the-blank",
        view: {
          instruction: "Input an answers which works",
          textWithBlanks: "A text with ~~A~~.",
        },
      }}
      onChange={console.log}
      ref={ref}
    />
  );
};
