import { css } from "@emotion/react";
import {
  Action,
  Answer,
  Evaluate,
  Evaluation,
  Feedback,
  Locales,
  Result,
  Task,
  TaskProps,
  TaskRef,
} from "@openpatch/bits-base";
import {
  MoodHappy,
  ThumbsDown,
  ThumbsUp,
  Asterisk,
} from "@openpatch/patches/dist/cjs/icons/shade";
import {
  Textarea,
  Box,
  ButtonPrimary,
  Heading,
  Icon,
  Text,
} from "@openpatch/patches";
import {
  ForwardRefExoticComponent,
  Fragment,
  RefAttributes,
  RefObject,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
} from "react";
import { ConfidenceLevels, ConfidenceLevelsProps } from "../ConfidenceLevels";
import {
  answerChangeAction,
  confidenceLevelsChangeAction,
  correctResultStateAction,
  evaluateAction,
  interactAction,
  IShellAction,
  ITaskAction,
  manualResultStateAction,
  mouseClickAction,
  nextAction,
  reasoningChangeAction,
  resizeAction,
  resultEmptyAction,
  resultReceiveAction,
  retryAction,
  retryResultStateAction,
  skipAction,
  unknownResultStateAction,
  wrongResultStateAction,
} from "./actions";
import { createReducer } from "./reducer";
import { IShell } from "../types";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "../Shell";

export type TaskShellProps<
  T extends Task,
  R extends Result,
  A extends Answer,
  Act extends Action,
  E extends Evaluation,
  F extends Feedback
> = {
  mode: "default" | "recording";
  task: T;
  TaskComponent: ForwardRefExoticComponent<
    TaskProps<T, R, A, Act> & RefAttributes<TaskRef<Act>>
  >;
  title: string;
  progress?: {
    value: number;
    max: number;
  };
  evaluate?: Evaluate<A, E, T, R, F>;
  evaluation?: E;
  feedback?: F;
  onSkip: () => void;
  onClose?: () => void;
  onAction?: (action: IShellAction<A, R> | ITaskAction<Act>) => void;
  enableReasoning?: boolean;
  enableConfidence?: boolean;
  soundUrls?: {
    correct: string;
    wrong: string;
    unknown: string;
    manual: string;
  };
  locales?: {
    retry: string;
    next: string;
    answer: string;
    skip: string;
    correctNudges: string[];
    wrongNudges: string[];
    unknownNudges: string[];
    manualNudges: string[];
    reasoning: string;
    confidence: string;
  };
  shellRef?: RefObject<TaskShellRef<A, R, Act>>;
} & IShell;

export type TaskShellRef<
  A extends Answer,
  R extends Result,
  Act extends Action
> = {
  dispatch: (action: IShellAction<A, R> | ITaskAction<Act>) => void;
};

export const TaskShell = <
  T extends Task,
  R extends Result,
  A extends Answer,
  Act extends Action,
  E extends Evaluation,
  F extends Feedback
>({
  mode,
  evaluate,
  evaluation,
  feedback,
  task,
  TaskComponent,
  progress,
  title,
  enableConfidence,
  enableReasoning,
  onSkip,
  onClose,
  onNext,
  onAction,
  soundUrls,
  locales = {
    retry: "Retry",
    next: "Next",
    answer: "Answer",
    skip: "Skip",
    correctNudges: ["Nice one!", "Great!", "Keep it going!"],
    wrongNudges: [
      "Maybe next time!",
      "No worries!",
      "Every wrong answer is a learning opportunity!",
      '"The phoenix must burn to emerge." - Janet Fitch',
      '"There is no failure except in no longer trying." - Chris Bradford',
      '"Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill',
      '"The only real mistake is the one from which we learn nothing." - Henry Ford',
      '"It’s not how far you fall, but how high you bounce that counts." - Zig Ziglar',
    ],
    manualNudges: ["Your answer will be check manually!"],
    unknownNudges: ["Thanks for your answer!", "Thank you for answering!"],
    reasoning: "Reasoning",
    confidence: "Confidence (higher is more confident)",
  },
  shellRef,
}: TaskShellProps<T, R, A, Act, E, F>) => {
  const [reducerState, dispatch] = useReducer(createReducer<A, R>(), {
    state: "interact",
  });
  const taskRef = useRef<TaskRef<Act>>(null);

  const nudge = reducerState.nudge;
  const state = reducerState.state;
  const confidence = reducerState.confidence;
  const reasoning = reducerState.reasoning;
  // Immer produces Immutable<A>. I am not sure if I want this type across all
  // components which use answer or result, therefore I cast the type back to
  // the original.
  const answer = reducerState.answer as A;
  const result = reducerState.result as R;

  const customDispatch = (action: IShellAction<A, R>) => {
    if (mode === "recording") return;
    // we do not need answer change, because we are submitting all individual
    // actions. We could submit snapshots after some time or after a few
    // actions.
    if (onAction && action.type !== "answer-change") {
      onAction(action);
    }
    dispatch(action);
  };

  function handleTaskAction(action: Act) {
    if (onAction) {
      onAction({ ...action, scope: "task" });
    }
  }

  useEffect(() => {
    const mouseDown = (e: MouseEvent) => {
      customDispatch(mouseClickAction({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener("mousedown", mouseDown);

    return () => window.removeEventListener("mousedown", mouseDown);
  }, [customDispatch]);

  useEffect(() => {
    customDispatch(
      resizeAction({ width: window.innerHeight, height: window.innerWidth })
    );
  }, []);

  useEffect(() => {
    const resize = (e: UIEvent) => {
      customDispatch(
        resizeAction({ width: window.innerHeight, height: window.innerWidth })
      );
    };

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  useImperativeHandle(
    shellRef,
    () => ({
      dispatch: (action: IShellAction<A, R> | ITaskAction<Act>) => {
        if (action.scope === "shell") {
          dispatch(action);
        } else if (taskRef.current) {
          dispatch(interactAction());
          taskRef.current.dispatch(action);
        }
      },
    }),
    [dispatch]
  );

  function handleConfidenceChange(value: ConfidenceLevelsProps["value"]) {
    customDispatch(confidenceLevelsChangeAction({ level: value }));
  }

  function handleReasoningChange(value: string) {
    customDispatch(reasoningChangeAction({ reasoning: value }));
  }

  function handleChange(value: A) {
    customDispatch(answerChangeAction({ answer: value }));
  }

  async function handleSubmit() {
    customDispatch(
      evaluateAction<A>({ answer })
    );
    let result: R | null = null;
    if (evaluate) {
      result = await evaluate({ answer, evaluation, task, feedback });
    }

    if (result) {
      if (result.state === "correct") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.correct).play();
          } catch (e) {}
        }
        const nudge =
          locales.correctNudges[
            Math.floor(Math.random() * locales.correctNudges.length)
          ];
        customDispatch(correctResultStateAction({ nudge }));
      } else if (result.state === "wrong" && result.allowRetry) {
        if (soundUrls) {
          try {
            new Audio(soundUrls.wrong).play();
          } catch (e) {}
        }
        customDispatch(retryResultStateAction());
      } else if (result.state === "wrong") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.wrong).play();
          } catch (e) {}
        }
        const nudge =
          locales.wrongNudges[
            Math.floor(Math.random() * locales.wrongNudges.length)
          ];
        customDispatch(wrongResultStateAction({ nudge }));
      } else if (result.state === "unknown") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.unknown).play();
          } catch (e) {}
        }
        const nudge =
          locales.unknownNudges[
            Math.floor(Math.random() * locales.unknownNudges.length)
          ];
        customDispatch(unknownResultStateAction({ nudge }));
      } else if (result.state === "manual") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.manual).play();
          } catch (e) {}
        }
        const nudge =
          locales.manualNudges[
            Math.floor(Math.random() * locales.manualNudges.length)
          ];
        customDispatch(manualResultStateAction({ nudge }));
      }
      customDispatch(resultReceiveAction({ result }));
    } else {
      customDispatch(resultEmptyAction());
    }
  }

  function handleNext() {
    customDispatch(nextAction());
    onNext();
  }

  function handleRetry() {
    customDispatch(retryAction());
  }

  function handleSkip() {
    customDispatch(skipAction());
    onSkip();
  }

  function handleClose() {
    if (onClose) {
      onClose();
    }
  }

  return (
    <Shell>
      <ShellHeader
        progress={progress}
        onClose={onClose ? handleClose : undefined}
      >
        {title}
      </ShellHeader>
      <ShellContent>
        <TaskComponent
          ref={taskRef}
          onChange={handleChange}
          onAction={handleTaskAction}
          mode={state === "interact" ? "default" : "result"}
          task={task}
          result={result}
        ></TaskComponent>
        {enableReasoning && state === "interact" && (
          <Box padding="standard">
            <Heading id="reasoning" as="h2" fontSize="standard" mb="standard">
              {locales.reasoning}
            </Heading>
            <Textarea
              aria-labelledby="reasoning"
              value={reasoning}
              onChange={handleReasoningChange}
            />
          </Box>
        )}
        {enableConfidence && state === "interact" && (
          <Box padding="standard">
            <Heading id="confidence" as="h2" fontSize="standard">
              {locales.confidence}
            </Heading>
            <ConfidenceLevels
              aria-labelledby="confidence"
              value={confidence}
              onClick={handleConfidenceChange}
            />
          </Box>
        )}
      </ShellContent>
      <ShellFooter>
        {state === "correct" && (
          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Box mb="xxsmall">
              <Icon color="success" size="small">
                <ThumbsUp />
              </Icon>
            </Box>
            <Text textColor="primary.800" mb="standard">
              {nudge}
            </Text>
            <ButtonPrimary onClick={handleNext} fullWidth>
              {locales.next}
            </ButtonPrimary>
          </Box>
        )}
        {state === "wrong" && (
          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Box mb="xxsmall">
              <Icon color="error" size="small">
                <ThumbsDown />
              </Icon>
            </Box>
            <Text textColor="error.800" mb="standard">
              {nudge}
            </Text>
            <ButtonPrimary onClick={handleNext} fullWidth>
              {locales.next}
            </ButtonPrimary>
          </Box>
        )}
        {state === "unknown" && (
          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Box mb="xxsmall">
              <Icon color="primary" size="small">
                <MoodHappy />
              </Icon>
            </Box>
            <Text textColor="primary.800" mb="standard">
              {nudge}
            </Text>
            <ButtonPrimary onClick={handleNext} fullWidth>
              {locales.next}
            </ButtonPrimary>
          </Box>
        )}
        {state === "manual" && (
          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Box mb="xxsmall">
              <Icon color="warning" size="small">
                <Asterisk />
              </Icon>
            </Box>
            <Text textColor="warning.800" mb="standard">
              {nudge}
            </Text>
            <ButtonPrimary onClick={handleNext} fullWidth>
              {locales.next}
            </ButtonPrimary>
          </Box>
        )}
        {(state === "interact" ||
          state === "evaluate" ||
          state === "retry") && (
          <Fragment>
            <Box flex="2" mr="standard">
              {state !== "retry" ? (
                <ButtonPrimary
                  css={css`
                    height: 100%;
                  `}
                  tone="primary"
                  disabled={state === "evaluate"}
                  loading={state === "evaluate"}
                  onClick={handleSubmit}
                  fullWidth
                >
                  {locales.answer}
                </ButtonPrimary>
              ) : (
                <ButtonPrimary
                  tone="primary"
                  css={css`
                    height: 100%;
                  `}
                  onClick={handleRetry}
                  fullWidth
                >
                  {locales.retry}
                </ButtonPrimary>
              )}
            </Box>
            <Box flex="1">
              <ButtonPrimary
                css={css`
                  height: 100%;
                `}
                tone="accent"
                onClick={handleSkip}
                fullWidth
              >
                {locales.skip}
              </ButtonPrimary>
            </Box>
          </Fragment>
        )}
      </ShellFooter>
    </Shell>
  );
};
