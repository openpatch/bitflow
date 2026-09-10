import {
  canLeaveNode,
  canSkip,
  computeScore,
  flowProgress,
  getBit,
  getNode,
  resolveLocale,
  sectionOf,
  taskTimeLimit,
  timeSpent,
  timeSpentOn,
  translate,
  visitedSteps,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitflowError,
} from "@bitflow/core";
import { BitFeedback, BitView, elementMessages, Markdown } from "@bitflow/element";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactElement,
  type Ref,
} from "react";
import { useStore } from "zustand";
import { Countdown } from "./Countdown";
import { summarise } from "./summarise";
import { createFlowStore, isTaskNode, type FlowState } from "./flowStore";
import { messages } from "./messages";
import {
  ConfidenceLevels,
  Progress,
  Reasoning,
  Shell,
  StepList,
} from "./Shell";

export type FlowHandle = {
  /** Publishes the current snapshot through `onSave` and returns it. */
  save: () => AttemptSnapshot | null;
  /** Abandons the current attempt and starts a fresh one. */
  reset: () => void;
};

export type FlowProps = {
  flow?: BitflowDocument | string;
  attempt?: AttemptSnapshot | string;
  locale?: string;
  /** Show the run without accepting further learner input. */
  readonly?: boolean;
  onStateChange?: (attempt: AttemptSnapshot) => void;
  onSave?: (attempt: AttemptSnapshot) => void;
  onComplete?: (attempt: AttemptSnapshot) => void;
  onError?: (error: BitflowError) => void;
  ref?: Ref<FlowHandle>;
};

/**
 * The learner's view of an assessment.
 *
 * The store is created per mount, so two `<Flow>`s on one page never share an
 * attempt — the thing that made the old React-Context provider awkward to
 * embed twice.
 */
export const Flow = ({
  flow,
  attempt,
  locale,
  readonly,
  onStateChange,
  onSave,
  onComplete,
  onError,
  ref,
}: FlowProps): ReactElement => {
  // Callbacks are read through a ref so that a host re-rendering with new
  // closures does not tear down and recreate the attempt.
  const callbacks = useRef({ onStateChange, onSave, onComplete, onError });
  callbacks.current = { onStateChange, onSave, onComplete, onError };

  const store = useMemo(
    () =>
      createFlowStore({
        onStateChange: (a) => callbacks.current.onStateChange?.(a),
        onSave: (a) => callbacks.current.onSave?.(a),
        onComplete: (a) => callbacks.current.onComplete?.(a),
        onError: (e) => callbacks.current.onError?.(e),
      }),
    [],
  );

  const state = useStore(store);
  const resolved = resolveLocale(locale);

  useEffect(() => {
    if (flow !== undefined) store.getState().loadFlow(flow);
  }, [flow, store]);

  // After the flow, always: an attempt can only be validated against a
  // document, and both properties may be assigned in the same tick.
  useEffect(() => {
    if (attempt !== undefined) store.getState().loadAttempt(attempt);
  }, [attempt, store]);

  useImperativeHandle(
    ref,
    () => ({
      save: () => store.getState().save(),
      reset: () => store.getState().reset(),
    }),
    [store],
  );

  if (!state.doc || !state.attempt) {
    return (
      <Shell>
        <p className="bitflow-text-muted">
          {translate(messages, state.error ? "noFlow" : "loading", resolved)}
        </p>
      </Shell>
    );
  }

  return (
    <FlowBody
      state={state}
      locale={resolved}
      readonly={readonly}
      doc={state.doc}
      attempt={state.attempt}
    />
  );
};

const FlowBody = ({
  state,
  doc,
  attempt,
  locale,
  readonly,
}: {
  state: FlowState;
  doc: BitflowDocument;
  attempt: AttemptSnapshot;
  locale: ReturnType<typeof resolveLocale>;
  readonly?: boolean;
}) => {
  const node = state.currentNode();
  const result = attempt.results[attempt.currentNodeId];
  const bit = node ? getBit(node.type) : undefined;
  const isTask = isTaskNode(node);
  const answered = result !== undefined;
  const progress = flowProgress(doc, attempt);
  const locked = readonly || answered || attempt.status !== "inProgress";

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(messages, key, locale, vars),
    [locale],
  );
  const tShared = useCallback(
    (key: string) => translate(elementMessages, key, locale),
    [locale],
  );

  /**
   * Focus moves to the step's content whenever the learner arrives somewhere
   * new.
   *
   * Without this, pressing Next leaves focus on the button that is no longer
   * there in spirit: a screen reader says nothing, and a keyboard user tabs
   * from the bottom of the page back up to find the question. Skipped on the
   * first render, where stealing focus from the host page would be rude.
   */
  const contentRef = useRef<HTMLDivElement>(null);
  const arrivedAt = useRef<string | null>(null);

  useEffect(() => {
    const nodeId = attempt.currentNodeId;
    if (arrivedAt.current === nodeId) return;
    const first = arrivedAt.current === null;
    arrivedAt.current = nodeId;
    if (!first) contentRef.current?.focus();
  }, [attempt.currentNodeId]);

  if (!node) {
    return (
      <Shell>
        <p className="bitflow-text-muted">{t("noFlow")}</p>
      </Shell>
    );
  }

  const score = computeScore(attempt);
  const complete = attempt.status === "completed";

  const flowLimit = doc.meta.timeLimit ? doc.meta.timeLimit * 1000 : null;
  const taskLimit = taskTimeLimit(getNode(doc, attempt.currentNodeId));
  const running = attempt.status === "inProgress" && !readonly;
  const showRetry = answered && result?.allowRetry === true && !readonly;
  // `end` bits render their own summary, so the shell adds no Next after them.
  const showNext = !complete && (!isTask || answered) && !readonly;
  // A step that is not graded but still has to be done — consent, saying who
  // you are — holds the learner here until it is. The step says what is
  // missing; all the runtime does is refuse to move on.
  const canLeave = canLeaveNode(node, state.draft);
  const showCheck = isTask && !answered && !readonly && Boolean(bit?.evaluate);
  const showSkip = isTask && !answered && !readonly && canSkip(doc, node);

  // The passage, listing or table this step and its neighbours are about. Kept
  // above the bit rather than inside it: it belongs to the section, and the bit
  // must not have to know it is in one.
  const section = sectionOf(doc, node);

  const showSteps = doc.meta.navigation === "free" && !readonly;
  const steps = showSteps
    ? visitedSteps(doc, attempt).map((step) => ({
        nodeId: step.nodeId,
        position: step.position,
        current: step.current,
        answered: step.answered,
        outstanding: step.outstanding,
        title:
          summarise(step.node.data) ||
          getBit(step.node.type)?.info(locale).name ||
          step.node.type,
      }))
    : [];

  return (
    <Shell
      contentRef={contentRef}
      announcement={t("stepAnnouncement", {
        visited: progress.visited,
        title: summarise(node.data) || bit?.info(locale).name || "",
      })}
      progress={
        <>
          <Progress
            visited={progress.visited}
            total={
              Number.isFinite(progress.remaining)
                ? progress.visited + progress.remaining
                : progress.visited
            }
            locale={locale}
          />
          {section?.label && (
            <p className="bitflow-section-label">{section.label}</p>
          )}
          {running && flowLimit !== null && (
            <Countdown
              // Recomputed from the snapshot each tick, so a reload resumes
              // with the time already spent and nothing else.
              remaining={() => flowLimit - timeSpent(attempt)}
              label={t("timeLeftWhole")}
              locale={locale}
              onExpire={state.finish}
            />
          )}
          {running && taskLimit !== null && !answered && (
            <Countdown
              key={attempt.currentNodeId}
              remaining={() =>
                taskLimit - timeSpentOn(attempt, attempt.currentNodeId)
              }
              label={t("timeLeftTask")}
              locale={locale}
              // Submitted rather than discarded: a half-finished answer is
              // still what they had when the clock ran out.
              onExpire={() => void state.check()}
            />
          )}
        </>
      }
      controls={
        <>
          <div className="bitflow-row">
            {state.canGoBack() && !readonly && (
              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={state.previous}
              >
                {tShared("previous")}
              </button>
            )}
          </div>
          <div className="bitflow-row bitflow-row-end">
            {showSkip && (
              <button
                type="button"
                className="bitflow-button bitflow-button-secondary"
                onClick={state.skip}
              >
                {tShared("skip")}
              </button>
            )}
            {showRetry && (
              <button
                type="button"
                className="bitflow-button bitflow-button-secondary"
                onClick={state.retry}
              >
                {tShared("retry")}
              </button>
            )}
            {showCheck && (
              <button
                type="button"
                className="bitflow-button"
                disabled={state.busy}
                onClick={() => void state.check()}
              >
                {tShared("check")}
              </button>
            )}
            {showNext && (
              <button
                type="button"
                className="bitflow-button"
                disabled={!canLeave}
                onClick={state.next}
              >
                {tShared("next")}
              </button>
            )}
            {complete && (
              <button
                type="button"
                className="bitflow-button"
                onClick={() => state.save()}
              >
                {t("save")}
              </button>
            )}
          </div>
        </>
      }
      steps={
        showSteps && steps.length > 0 ? (
          <StepList steps={steps} locale={locale} onGoTo={state.goTo} />
        ) : undefined
      }
    >
      {section?.markdown && (
        <div className="bitflow-section-stimulus">
          <Markdown markdown={section.markdown} />
        </div>
      )}

      <BitView
        type={node.type}
        data={node.data}
        answer={state.draft}
        result={result}
        readonly={locked}
        locale={locale}
        onAnswerChange={state.setDraft}
        attempt={attempt}
        flow={doc}
      />

      {result && (
        <BitFeedback
          result={result}
          locale={locale}
          tries={attempt.tries[node.id]}
        />
      )}

      {/* Asked after answering, so thinking about certainty cannot bias the
          answer itself. */}
      {isTask && answered && doc.meta.askConfidence && (
        <ConfidenceLevels
          value={attempt.confidence?.[node.id]?.level}
          locale={locale}
          disabled={readonly}
          onChange={(level) => state.setConfidence({ level })}
        />
      )}

      {isTask && answered && doc.meta.askReasoning && (
        <Reasoning
          value={attempt.reasoning?.[node.id]}
          locale={locale}
          disabled={readonly}
          onChange={state.setReasoning}
        />
      )}

      {complete && (
        <div className="bitflow-alert bitflow-alert-success">
          <div>
            <strong>{t("completed")}</strong>
            {score.possible > 0 && (
              <p className="bitflow-text-muted">
                {t("score", { earned: round(score.earned), possible: score.possible })}
              </p>
            )}
          </div>
        </div>
      )}

      {state.error && (
        <div className="bitflow-alert bitflow-alert-error" role="alert">
          {state.error.message}
        </div>
      )}
    </Shell>
  );
};

/** Partial credit produces fractions; two decimals is as fine as anyone reads. */
const round = (value: number): number => Math.round(value * 100) / 100;
