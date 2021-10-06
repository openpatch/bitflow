import { Action, TaskProps, TaskRef } from "@bitflow/core";
import { css } from "@emotion/react";
import {
  Box,
  ButtonPrimary,
  Heading,
  Icon,
  Text,
  Textarea,
} from "@openpatch/patches";
import {
  Asterisk,
  MoodHappy,
  ThumbsDown,
  ThumbsUp,
} from "@openpatch/patches/icons/shade";
import { useTranslations } from "@vocab/react";
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
import translations from "../locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "../Shell";
import { IShell } from "../types";
import {
  answerChangeAction,
  closeAction,
  closeErrorAction,
  confidenceLevelsChangeAction,
  correctResultStateAction,
  evaluateAction,
  interactAction,
  IShellAction,
  ITaskAction,
  manualResultStateAction,
  mouseClickAction,
  nextAction,
  nextErrorAction,
  previousAction,
  previousErrorAction,
  reasoningChangeAction,
  resizeAction,
  resultEmptyAction,
  resultReceiveAction,
  retryAction,
  retryResultStateAction,
  skipAction,
  skipErrorAction,
  unknownResultStateAction,
  wrongResultStateAction,
} from "./actions";
import { createReducer, IState } from "./reducer";

export type TaskShellProps<
  T extends Bitflow.Task,
  R extends Bitflow.TaskResult,
  A extends Bitflow.TaskAnswer,
  Act extends Action
> = {
  mode: "default" | "recording" | "result";
  task: T | Pick<T, "view" | "subtype">;
  TaskComponent: ForwardRefExoticComponent<
    TaskProps<T, R, A, Act> & RefAttributes<TaskRef<Act>>
  >;
  header?: string;
  progress?: {
    value: number;
    max: number;
  };
  evaluate?: (answer: A) => Promise<R>;
  onSkip?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  onAction?: (action: IShellAction<A, R> | ITaskAction<Act>) => void;
  enableReasoning?: boolean;
  enableConfidence?: boolean;
  result?: R;
  answer?: A;
  soundUrls?: {
    correct: string;
    wrong: string;
    unknown: string;
    manual: string;
  };
  shellRef?: RefObject<TaskShellRef<A, R, Act>>;
} & IShell;

export type TaskShellRef<
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult,
  Act extends Action
> = {
  dispatch: (action: IShellAction<A, R> | ITaskAction<Act>) => void;
};

export const TaskShell = <
  T extends Bitflow.Task,
  R extends Bitflow.TaskResult,
  A extends Bitflow.TaskAnswer,
  Act extends Action
>({
  mode,
  evaluate,
  task,
  TaskComponent,
  progress,
  header,
  enableConfidence,
  enableReasoning,
  answer: initialAnswer,
  result: initialResult,
  onSkip,
  onClose,
  onNext,
  onRetry,
  onPrevious,
  onAction,
  soundUrls,
  shellRef,
}: TaskShellProps<T, R, A, Act>) => {
  const { t } = useTranslations(translations);
  const [reducerState, dispatch] = useReducer(
    createReducer<A, R>() as any as (
      state: IState<A, R>,
      action: IShellAction<A, R>
    ) => IState<A, R>,
    { state: "interact" }
  );
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
    if (mode === "recording" || mode === "result") return;
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
    if (initialAnswer) {
      dispatch(answerChangeAction({ answer: initialAnswer }));
    }
  }, [initialAnswer]);

  useEffect(() => {
    if (initialResult) {
      dispatch(resultReceiveAction({ result: initialResult }));
    }
  }, [initialResult]);

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
    customDispatch(evaluateAction<A>({ answer }));
    let result: R | null = null;
    if (evaluate) {
      result = await evaluate(answer);
    }

    if (result) {
      if (result.state === "correct") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.correct).play();
          } catch (e) {}
        }
        const nudge = t("correctNudges", {
          index: Math.floor(Math.random() * 2),
        });
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
        const nudge = t("wrongNudges", {
          index: Math.floor(Math.random() * 3),
        });
        customDispatch(wrongResultStateAction({ nudge }));
      } else if (result.state === "unknown") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.unknown).play();
          } catch (e) {}
        }
        const nudge = t("unknownNudges", {
          index: Math.floor(Math.random() * 2),
        });
        customDispatch(unknownResultStateAction({ nudge }));
      } else if (result.state === "manual") {
        if (soundUrls) {
          try {
            new Audio(soundUrls.manual).play();
          } catch (e) {}
        }
        const nudge = t("manualNudges", {
          index: Math.floor(Math.random() * 2),
        });
        customDispatch(manualResultStateAction({ nudge }));
      }
      customDispatch(resultReceiveAction({ result }));
    } else {
      customDispatch(resultEmptyAction());
    }
  }

  function handleNext() {
    customDispatch(nextAction());
    onNext().catch(() => {
      customDispatch(nextErrorAction());
    });
  }

  function handleRetry() {
    if (onRetry) {
      customDispatch(retryAction());
      onRetry().then(() => {
        customDispatch(interactAction());
      });
    }
  }

  function handleSkip() {
    if (onSkip) {
      customDispatch(skipAction());
      onSkip().catch(() => {
        customDispatch(skipErrorAction());
      });
    }
  }

  function handleClose() {
    customDispatch(closeAction());
    if (onClose) {
      onClose().catch(() => {
        customDispatch(closeErrorAction());
      });
    }
  }

  function handlePrevious() {
    customDispatch(previousAction());
    if (onPrevious) {
      onPrevious().catch(() => {
        customDispatch(previousErrorAction());
      });
    }
  }

  return (
    <Shell noHeader={!header}>
      {header && (
        <ShellHeader
          progress={progress}
          onPrevious={onPrevious ? handlePrevious : undefined}
          onClose={onClose ? handleClose : undefined}
          loadingClose={state === "close"}
          loadingPrevious={state === "previous"}
          disabled={
            state === "skip" ||
            state === "next" ||
            state === "previous" ||
            state === "close"
          }
        >
          {header}
        </ShellHeader>
      )}
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
              {t("reasoning")}
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
              {t("confidence")}
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
              {t("next")}
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
              {t("next")}
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
              {t("next")}
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
              {t("next")}
            </ButtonPrimary>
          </Box>
        )}
        {(state === "interact" ||
          state === "evaluate" ||
          state === "allow-retry" ||
          state === "next" ||
          state === "skip" ||
          state === "close" ||
          state === "previous") && (
          <Fragment>
            <Box flex="2" mr="standard">
              {state !== "allow-retry" ? (
                <ButtonPrimary
                  css={css`
                    height: 100%;
                  `}
                  tone="primary"
                  disabled={
                    state === "evaluate" ||
                    state === "skip" ||
                    state === "next" ||
                    state === "close" ||
                    state === "previous"
                  }
                  loading={state === "evaluate"}
                  onClick={handleSubmit}
                  fullWidth
                >
                  {t("answer")}
                </ButtonPrimary>
              ) : (
                onRetry && (
                  <ButtonPrimary
                    tone="primary"
                    css={css`
                      height: 100%;
                    `}
                    onClick={handleRetry}
                    fullWidth
                  >
                    {t("retry")}
                  </ButtonPrimary>
                )
              )}
            </Box>
            {onSkip && (
              <Box flex="1">
                <ButtonPrimary
                  css={css`
                    height: 100%;
                  `}
                  disabled={
                    state === "evaluate" ||
                    state === "skip" ||
                    state === "next" ||
                    state === "close" ||
                    state === "previous"
                  }
                  loading={state === "skip"}
                  tone="accent"
                  onClick={handleSkip}
                  fullWidth
                >
                  {t("skip")}
                </ButtonPrimary>
              </Box>
            )}
          </Fragment>
        )}
      </ShellFooter>
    </Shell>
  );
};
