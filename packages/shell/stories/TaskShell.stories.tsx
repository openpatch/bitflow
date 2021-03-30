import {
  evaluate,
  IAction,
  IAnswer,
  IResult,
  ITask,
  Task,
} from "@bitflow/task-choice";
import { Box } from "@openpatch/patches";
import { Meta, Story } from "@storybook/react/types-6-0";
import { useEffect, useRef } from "react";
import { TaskShell, TaskShellProps, TaskShellRef } from "../src/TaskShell";
import { IShellAction, ITaskAction } from "../src/TaskShell/actions";

export default {
  title: "Shells/Task",
  argTypes: {
    onAction: { action: "action" },
    onNext: { action: "next" },
    onSkip: { action: "skip" },
    mode: {
      name: "Mode",
      defaultValue: "local",
      control: {
        type: "select",
        options: ["local", "remote"],
      },
    },
  },
} as Meta;

const data: {
  task: ITask;
} = {
  task: {
    subtype: "choice",
    description: "",
    name: "A title",
    view: {
      instruction: `This is a interessting task. Please select the options you **want**, but be sure to only select **Answer A**.
![](https://upload.wikimedia.org/wikipedia/commons/f/f1/SWTestbild.png)`,
      choices: [{ markdown: "Answer A" }, { markdown: "Answer B" }],
      variant: "multiple",
    },
    evaluation: {
      mode: "auto",
      correct: ["a"],
      enableRetry: true,
      showFeedback: true,
    },
    feedback: {
      patterns: {
        b: { message: "A feedback for pattern b", severity: "error" },
        ab: { message: "A feedback for pattern ab", severity: "error" },
      },
      choices: {},
    },
  },
};

const evaluateRemoteMock = ({ task }: { task: ITask }) => (
  answer?: IAnswer
): Promise<IResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(evaluate({ answer, task }));
    }, 2000);
  });
};

const evaluateLocalMock = ({ task }: { task: ITask }) => (
  answer?: IAnswer
): Promise<IResult> => {
  return evaluate({ answer, task });
};

const props: TaskShellProps<ITask, IResult, IAnswer, IAction> = {
  header: "A Test",
  progress: {
    value: 2,
    max: 6,
  },
  mode: "default",
  TaskComponent: Task,
  evaluate: evaluateLocalMock({ task: data.task }),
  task: data.task,
  soundUrls: {
    correct: "/correct.mp3",
    wrong: "/wrong.mp3",
    unknown: "/unknown.mp3",
    manual: "/manual.mp3",
  },
  onSkip: console.log,
  onNext: console.log,
};

export const Default: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction> {...props} {...args} />
  </Box>
);

export const WithReasoningAndConfidence: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction>
      {...props}
      {...args}
      enableConfidence
      enableReasoning
    />
  </Box>
);

export const EvaluationRemote: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction>
      {...props}
      {...args}
      evaluate={evaluateRemoteMock({
        task: data.task,
      })}
    />
  </Box>
);

export const NoEvaluation: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction>
      {...props}
      {...args}
      evaluate={evaluateLocalMock({
        task: {
          ...data.task,
          evaluation: {
            mode: "skip",
            correct: [],
            enableRetry: false,
            showFeedback: false,
          },
        },
      })}
    />
  </Box>
);

export const EvaluationManual: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction>
      {...props}
      {...args}
      evaluate={evaluateLocalMock({
        task: {
          ...data.task,
          evaluation: {
            mode: "manual",
            correct: data.task.evaluation.correct,
            enableRetry: false,
            showFeedback: false,
          },
        },
      })}
    />
  </Box>
);

export const NoFeedback: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction>
      {...props}
      {...args}
      evaluate={evaluateLocalMock({
        task: {
          ...data.task,
          feedback: {
            choices: {},
            patterns: {},
          },
        },
      })}
    />
  </Box>
);

export const NoRetry: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => (
  <Box height="100vh" width="100wv">
    <TaskShell<ITask, IResult, IAnswer, IAction>
      {...props}
      {...args}
      evaluate={evaluateLocalMock({
        task: {
          ...data.task,
          evaluation: {
            ...data.task.evaluation,
            enableRetry: false,
          },
        },
      })}
    />
  </Box>
);

export const Recording: Story<
  TaskShellProps<ITask, IResult, IAnswer, IAction>
> = (args) => {
  const ref = useRef<TaskShellRef<IAnswer, IResult, IAction>>(null);
  const actions = useRef<
    (IShellAction<IAnswer, IResult> | ITaskAction<IAction>)[]
  >([
    {
      scope: "shell",
      type: "result-receive",
      payload: {
        result: {
          state: "correct",
          choices: {
            a: {
              state: "correct",
            },
          },
        },
      },
    },
    {
      scope: "shell",
      type: "correct-result-state",
      payload: {
        nudge: "Great work!",
      },
    },
    {
      scope: "shell",
      type: "evaluate",
      payload: { answer: { checked: {} } },
    },
    {
      type: "check",
      scope: "task",
      payload: {
        choice: "a",
        variant: "single",
      },
    },
    {
      type: "check",
      scope: "task",
      payload: {
        choice: "b",
        variant: "single",
      },
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        const nextAction = actions.current.pop();
        if (nextAction) {
          ref.current.dispatch(nextAction);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box height="100vh" width="100wv">
      <TaskShell<ITask, IResult, IAnswer, IAction>
        {...props}
        {...args}
        mode="recording"
        shellRef={ref}
      />
    </Box>
  );
};
