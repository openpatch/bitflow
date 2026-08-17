import {
  bitflowError,
  getBit,
  resolveLocale,
  translate,
  type AttemptSnapshot,
  type BitResult,
} from "@bitflow/core";
import r2wc from "@r2wc/react-to-web-component";
import { useCallback, useEffect, useRef, useState } from "react";
import { BitFeedback } from "./BitFeedback";
import { BitView } from "./BitView";
import { messages } from "./messages";

export type StandaloneBitProps = {
  /** Supplied by r2wc: the custom element itself, and our event target. */
  container?: HTMLElement;
  data?: unknown;
  answer?: unknown;
  result?: BitResult;
  readonly?: boolean;
  locale?: string;
  /**
   * A finished or in-progress run, for the bits that summarise one. Only `end`
   * bits read it; see `BitTaskProps.attempt`.
   */
  attempt?: AttemptSnapshot;
  /**
   * Show the element's own check/retry buttons. A host that provides its own
   * (as `<bitflow-flow>`'s shell does) sets this to false.
   */
  controls?: boolean;
};

const emit = (
  target: HTMLElement | undefined,
  name: string,
  detail: unknown,
): void => {
  // `composed` so the event still reaches the page if the element is ever
  // placed inside someone else's shadow root.
  target?.dispatchEvent(
    new CustomEvent(name, { detail, bubbles: true, composed: true }),
  );
};

/**
 * Creates and registers `bitflow-<type>` for an already-registered bit.
 *
 * Called by each bit package right after `registerBit`, so importing the
 * package is the one action that makes the bit usable — both as a node inside
 * a flow and dropped on its own into any HTML page.
 */
export const defineBitElement = (
  type: string,
  tagName = `bitflow-${type}`,
): void => {
  if (typeof customElements === "undefined") return; // SSR / Node
  // Two bundles on one page may both define the same bit. Redefining throws,
  // and the definitions are equivalent, so the first one wins.
  if (customElements.get(tagName)) return;

  const Element = (props: StandaloneBitProps) => (
    <StandaloneBitBody {...props} type={type} />
  );

  customElements.define(
    tagName,
    r2wc(Element, {
      props: {
        data: "json",
        answer: "json",
        result: "json",
        readonly: "boolean",
        locale: "string",
        attempt: "json",
        controls: "boolean",
      },
    }),
  );
};

const StandaloneBitBody = ({
  container,
  type,
  data,
  answer: answerProp,
  result: resultProp,
  readonly,
  locale,
  attempt,
  controls = true,
}: StandaloneBitProps & { type: string }) => {
  const resolved = resolveLocale(locale);
  const bit = getBit(type);

  const [answer, setAnswer] = useState<unknown>(answerProp);
  const [result, setResult] = useState<BitResult | undefined>(resultProp);
  const [tries, setTries] = useState(0);

  // A host that reassigns the property is restoring state, not answering, so
  // this must not emit `bitflow-answerchange`.
  useEffect(() => setAnswer(answerProp), [answerProp]);
  useEffect(() => setResult(resultProp), [resultProp]);

  const onAnswerChange = useCallback(
    (next: unknown) => {
      setAnswer(next);
      emit(container, "bitflow-answerchange", { answer: next });
    },
    [container],
  );

  // Guards against a slow evaluator resolving after the learner has moved on.
  const evaluating = useRef(false);

  const check = useCallback(async () => {
    if (!bit?.evaluate || evaluating.current) return;
    evaluating.current = true;
    try {
      const evaluated = await bit.evaluate({ data, answer });
      setResult(evaluated);
      setTries((count) => count + 1);
      emit(container, "bitflow-evaluated", { answer, result: evaluated });
    } catch (cause) {
      emit(
        container,
        "bitflow-error",
        bitflowError(
          "EVALUATION_FAILED",
          `Evaluating ${type} failed: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
        ),
      );
    } finally {
      evaluating.current = false;
    }
  }, [answer, bit, container, data, type]);

  const retry = useCallback(() => setResult(undefined), []);

  const showControls =
    controls && !readonly && bit?.kind === "task" && Boolean(bit.evaluate);
  const answered = result !== undefined;

  return (
    <div className="bitflow-root bitflow-stack bitflow-bit">
      <BitView
        type={type}
        data={data}
        answer={answer}
        result={result}
        readonly={readonly || answered}
        locale={resolved}
        onAnswerChange={onAnswerChange}
        attempt={attempt}
      />

      {result && <BitFeedback result={result} locale={resolved} tries={tries} />}

      {showControls && (
        <div className="bitflow-row bitflow-row-end">
          {answered && result.allowRetry !== false ? (
            <button type="button" className="bitflow-button" onClick={retry}>
              {translate(messages, "retry", resolved)}
            </button>
          ) : null}
          {!answered && (
            <button type="button" className="bitflow-button" onClick={check}>
              {translate(messages, "check", resolved)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
