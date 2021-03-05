import { Story, Meta } from "@storybook/react/types-6-0";
import {
  taskChoiceEvaluate,
  ITaskChoiceAction,
  ITaskChoiceAnswer,
  ITaskChoiceEvaluation,
  ITaskChoiceFeedback,
  ITaskChoiceResult,
  ITaskChoice,
  TaskChoice,
} from "@openpatch/bits-task-choice";

import { TaskShellProps, TaskShell, TaskShellRef } from "../src/TaskShell";
import { useEffect, useRef } from "react";
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
  task: ITaskChoice;
  evaluation: ITaskChoiceEvaluation;
  feedback: ITaskChoiceFeedback;
} = {
  task: {
    title: "A title",
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
};

const evaluateRemoteMock = ({ task, evaluation }) => ({
  answer,
}: {
  answer?: ITaskChoiceAnswer;
}): Promise<ITaskChoiceResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(taskChoiceEvaluate({ answer, task, evaluation }));
    }, 2000);
  });
};

const props: TaskShellProps<
  ITaskChoice,
  ITaskChoiceResult,
  ITaskChoiceAnswer,
  ITaskChoiceAction,
  ITaskChoiceEvaluation,
  ITaskChoiceFeedback
> = {
  title: "A Test",
  progress: {
    value: 2,
    max: 6,
  },
  mode: "default",
  TaskComponent: TaskChoice,
  evaluate: taskChoiceEvaluate,
  task: data.task,
  evaluation: data.evaluation,
  feedback: data.feedback,
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
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
  />
);

export const WithReasoningAndConfidence: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
    enableConfidence
    enableReasoning
  />
);

export const EvaluationRemote: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
    evaluate={evaluateRemoteMock({
      task: props.task,
      evaluation: props.evaluation,
    })}
  />
);

export const NoEvaluation: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
    evaluation={undefined}
  />
);

export const EvaluationManual: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
    evaluation={{ ...props.evaluation, mode: "manual" }}
  />
);

export const NoFeedback: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
    feedback={undefined}
  />
);

export const NoRetry: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => (
  <TaskShell<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
    {...props}
    {...args}
    evaluation={{ ...props.evaluation, enableRetry: false }}
  />
);

export const Recording: Story<
  TaskShellProps<
    ITaskChoice,
    ITaskChoiceResult,
    ITaskChoiceAnswer,
    ITaskChoiceAction,
    ITaskChoiceEvaluation,
    ITaskChoiceFeedback
  >
> = (args) => {
  const ref = useRef<
    TaskShellRef<ITaskChoiceAnswer, ITaskChoiceResult, ITaskChoiceAction>
  >();
  const actions = useRef<
    (
      | IShellAction<ITaskChoiceAnswer, ITaskChoiceResult>
      | ITaskAction<ITaskChoiceAction>
    )[]
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
      payload: null,
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
    <TaskShell<
      ITaskChoice,
      ITaskChoiceResult,
      ITaskChoiceAnswer,
      ITaskChoiceAction,
      ITaskChoiceEvaluation,
      ITaskChoiceFeedback
    >
      {...props}
      {...args}
      mode="recording"
      shellRef={ref}
    />
  );
};
