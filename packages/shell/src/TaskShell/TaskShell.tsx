import {
  Action,
  Task,
  TaskAnswer,
  TaskProps,
  TaskRef,
  TaskResult,
} from "@bitflow/base";
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
} from "@openpatch/patches/dist/cjs/icons/shade";
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

export type TaskShellProps<
  T extends Task,
  R extends TaskResult,
  A extends TaskAnswer,
  Act extends Action
> = {
  mode: "default" | "recording";
  task: Pick<T, "view" | "subtype">;
  TaskComponent: ForwardRefExoticComponent<
    TaskProps<T, R, A, Act> & RefAttributes<TaskRef<Act>>
  >;
  header: string;
  progress?: {
    value: number;
    max: number;
  };
  evaluate?: (answer: A) => Promise<R>;
  onSkip: () => void;
  onAction?: (action: IShellAction<A, R> | ITaskAction<Act>) => void;
  enableReasoning?: boolean;
  enableConfidence?: boolean;
  soundUrls?: {
    correct: string;
    wrong: string;
    unknown: string;
    manual: string;
  };
  shellRef?: RefObject<TaskShellRef<A, R, Act>>;
} & IShell;

export type TaskShellRef<
  A extends TaskAnswer,
  R extends TaskResult,
  Act extends Action
> = {
  dispatch: (action: IShellAction<A, R> | ITaskAction<Act>) => void;
};

export const TaskShell = <
  T extends Task,
  R extends TaskResult,
  A extends TaskAnswer,
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
  onSkip,
  onClose,
  onNext,
  onPrevious,
  onAction,
  soundUrls,
  shellRef,
}: TaskShellProps<T, R, A, Act>) => {
  const { t } = useTranslations(translations);
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

  function handlePrevious() {
    if (onPrevious) {
      onPrevious();
    }
  }

  return (
    <Shell>
      <ShellHeader
        progress={progress}
        onPrevious={onPrevious ? handlePrevious : undefined}
        onClose={onClose ? handleClose : undefined}
      >
        {header}
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
                  {t("answer")}
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
                  {t("retry")}
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
                {t("skip")}
              </ButtonPrimary>
            </Box>
          </Fragment>
        )}
      </ShellFooter>
    </Shell>
  );
};
