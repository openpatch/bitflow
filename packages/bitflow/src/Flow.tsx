import {
  computeScore,
  flowProgress,
  getBit,
  resolveLocale,
  translate,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitflowError,
} from "@bitflow/core";
import { BitFeedback, BitView, elementMessages } from "@bitflow/element";
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
import { createFlowStore, isTaskNode, type FlowState } from "./flowStore";
import { messages } from "./messages";
import { ConfidenceLevels, Progress, Reasoning, Shell } from "./Shell";

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

  if (!node) {
    return (
      <Shell>
        <p className="bitflow-text-muted">{t("noFlow")}</p>
      </Shell>
    );
  }

  const score = computeScore(attempt);
  const complete = attempt.status === "completed";
  const showRetry = answered && result?.allowRetry === true && !readonly;
  // `end` bits render their own summary, so the shell adds no Next after them.
  const showNext = !complete && (!isTask || answered) && !readonly;
  const showCheck = isTask && !answered && !readonly && Boolean(bit?.evaluate);

  return (
    <Shell
      progress={
        <Progress
          visited={progress.visited}
          total={
            Number.isFinite(progress.remaining)
              ? progress.visited + progress.remaining
              : progress.visited
          }
          locale={locale}
        />
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
            {isTask && !answered && !readonly && (
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
    >
      <BitView
        type={node.type}
        data={node.data}
        answer={state.draft}
        result={result}
        readonly={locked}
        locale={locale}
        onAnswerChange={state.setDraft}
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
