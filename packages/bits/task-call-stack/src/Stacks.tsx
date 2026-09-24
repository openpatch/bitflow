import { translate, type Locale } from "@bitflow/core";
import { useState, type ReactElement } from "react";
import type { StackState } from "./evaluate";
import { messages } from "./messages";
import {
  carriedStack,
  linesOf,
  withStack,
  type Answer,
  type Checkpoint,
  type Data,
  type Frame,
} from "./schema";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

const checkpointName = (checkpoint: Checkpoint, index: number, t: Translate) =>
  checkpoint.label || t("unnamedMoment", { number: index + 1 });

/**
 * The program, as text: a list item per line, so a moment can be marked
 * against the line it belongs to, with the number as real text so it is read
 * out with the line.
 */
export const CodeListing = ({ data, locale }: { data: Data; locale: Locale }): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const marks = new Map<number, string[]>();
  data.checkpoints.forEach((checkpoint, index) => {
    if (checkpoint.line === undefined) return;
    marks.set(checkpoint.line, [...(marks.get(checkpoint.line) ?? []), checkpointName(checkpoint, index, t)]);
  });

  return (
    <figure className="bitflow-callstack-code">
      <figcaption className="bitflow-label">
        {data.language ? t("codeLabelIn", { language: data.language }) : t("codeLabel")}
      </figcaption>
      <ol className="bitflow-callstack-lines">
        {linesOf(data.code).map((line, index) => (
          <li key={index} className="bitflow-callstack-line">
            {data.showLineNumbers && <span className="bitflow-callstack-number">{index + 1}</span>}
            {/* A blank line still takes a line, or the numbering the learner
                reads against stops matching the listing. */}
            <code>{line === "" ? " " : line}</code>
            {(marks.get(index + 1) ?? []).map((label) => (
              <span key={label} className="bitflow-callstack-mark">
                {label}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </figure>
  );
};

/**
 * A stack per moment, drawn the way a stack is drawn: the running call on top.
 *
 * A call is pushed onto the top and popped off it, and nothing else — the same
 * two operations the program performs — so a stack cannot be answered by
 * shuffling frames into an order no program could produce. Each moment starts
 * from the stack the learner wrote for the one before.
 */
export const Stacks = ({
  data,
  answer,
  states,
  readonly,
  locale,
  onChange,
}: {
  data: Data;
  answer?: Answer;
  states?: StackState[];
  readonly?: boolean;
  locale: Locale;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const [announcement, setAnnouncement] = useState("");

  return (
    <div className="bitflow-callstack-moments">
      {data.checkpoints.map((checkpoint, index) => {
        const name = checkpointName(checkpoint, index, t);
        const stack = carriedStack(data, answer, index);
        const state = states?.[index];
        const set = (next: Frame[]) => onChange(withStack(answer, checkpoint.id, next));
        const setFrame = (top: number, changes: Partial<Frame>) =>
          set(stack.map((frame, at) => (at === top ? { ...frame, ...changes } : frame)));

        return (
          <section key={checkpoint.id} className="bitflow-callstack-moment" aria-label={name}>
            <div className="bitflow-callstack-moment-header">
              <h3 className="bitflow-label">
                {name}
                {checkpoint.line !== undefined && (
                  <span className="bitflow-callstack-at"> {t("atLine", { line: checkpoint.line })}</span>
                )}
              </h3>
              {state && <span className={`bitflow-state bitflow-state-${state.state}`}>{t(state.state)}</span>}
            </div>

            {stack.length === 0 ? (
              <p className="bitflow-text-muted">{t("emptyStack")}</p>
            ) : (
              <ol className="bitflow-callstack-stack" aria-label={t("stackLabel", { moment: name })}>
                {stack.map((frame, top) => {
                  const right = state?.frames[top];
                  const classes = ["bitflow-callstack-frame"];
                  if (top === 0) classes.push("bitflow-callstack-frame-top");
                  if (right !== undefined) {
                    classes.push(right ? "bitflow-callstack-frame-correct" : "bitflow-callstack-frame-wrong");
                  }
                  const position = top === 0 ? t("topFrame") : t("frameBelow", { number: top });
                  return (
                    <li key={stack.length - 1 - top} className={classes.join(" ")}>
                      <input
                        type="text"
                        className="bitflow-input bitflow-callstack-call"
                        aria-label={t("callLabel", { position, moment: name })}
                        placeholder={t("callPlaceholder")}
                        value={frame.call}
                        disabled={readonly}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        onChange={(event) => setFrame(top, { call: event.target.value })}
                      />
                      {data.showLocals && (
                        <input
                          type="text"
                          className="bitflow-input bitflow-callstack-locals"
                          aria-label={t("localsLabel", { position, moment: name })}
                          placeholder={t("localsPlaceholder")}
                          value={frame.locals}
                          disabled={readonly}
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          onChange={(event) => setFrame(top, { locals: event.target.value })}
                        />
                      )}
                      {right !== undefined && (
                        <span className="bitflow-visually-hidden">{t(right ? "correct" : "wrong")}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            {!readonly && (
              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-secondary"
                  onClick={() => {
                    set([{ call: "", locals: "" }, ...stack]);
                    setAnnouncement(t("pushed", { moment: name, height: stack.length + 1 }));
                  }}
                >
                  {t("push")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-secondary"
                  disabled={stack.length === 0}
                  onClick={() => {
                    set(stack.slice(1));
                    setAnnouncement(t("popped", { moment: name, height: stack.length - 1 }));
                  }}
                >
                  {t("pop")}
                </button>
              </div>
            )}
          </section>
        );
      })}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
