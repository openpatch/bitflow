import { TaskProps, TaskRef } from "@bitflow/base";
import { Meta, Story } from "@storybook/react/types-6-0";
import { useEffect, useRef } from "react";
import { ITask } from "../src/schemas";
import { Task } from "../src/Task";
import { IAction, IAnswer, IResult } from "../src/types";

export default {
  title: "Tasks/Multiple Choice/Task",
  component: Task,
  argTypes: {},
} as Meta;

const Template: Story<TaskProps<ITask, IResult, IAnswer, IAction>> = (args) => (
  <Task {...args} />
);

export const Default = Template.bind({});
Default.args = {
  mode: "default",
  onChange: console.log,
  task: {
    subtype: "choice",
    view: {
      instruction: "**This is an instruction**",
      variant: "single",
      choices: [
        { markdown: "Answer A" },
        { markdown: "Answer B" },
        { markdown: "Answer C" },
        { markdown: "Answer D" },
      ],
    },
  },
};

export const Result = Template.bind({});
Result.args = {
  mode: "result",
  task: {
    subtype: "choice",
    view: {
      instruction: "",
      variant: "single",
      choices: [
        { markdown: "Answer A" },
        { markdown: "Answer B" },
        { markdown: "Answer C" },
        { markdown: "Answer D" },
        {
          markdown:
            "This is a **super** long answer, which might not be used in production but is here for testing the layout on various platforms.",
        },
        {
          markdown:
            "![Image](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/SIPI_Jelly_Beans_4.1.07.tiff/lossy-page1-256px-SIPI_Jelly_Beans_4.1.07.tiff.jpg)",
        },
        {
          markdown: `
\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`
      `,
        },
      ],
    },
  },
  onChange: console.log,
  result: {
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
  },
  answer: {
    checked: {
      a: true,
    },
  },
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
