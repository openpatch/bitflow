import { translate, type Locale } from "@bitflow/core";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";
import type { BlankOutcome } from "./evaluate";
import {
  loadMathfield,
  thinIncorrectStrike,
  type MathfieldApi,
  type MathfieldModule,
} from "./mathfield";
import { messages } from "./messages";
import { answerNamesIn, hasBlanks, SINGLE_BLANK, type Answer, type Data } from "./schema";

/**
 * The maths field, and what to show while there is not one.
 *
 * Two shapes, one component, because the author's template decides which:
 * a formula with `\placeholder` blanks becomes a read-only field with editable
 * gaps, and a formula without them becomes one editable field. MathLive treats
 * both as the same widget with different prompts, and so does this.
 */
export const MathAnswer = ({
  data,
  answer,
  outcomes,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  /** Per-blank marks, once the answer has been checked. */
  outcomes?: BlankOutcome[];
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const [module, setModule] = useState<MathfieldModule | undefined>();
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let live = true;
    loadMathfield().then((loaded) => {
      if (!live) return;
      setModule(loaded);
      setState(loaded ? "ready" : "unavailable");
    });
    return () => {
      live = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <p className="bitflow-math-status" role="status">
        {t("loading")}
      </p>
    );
  }

  if (state === "unavailable" || !module) {
    return (
      <LatexFallback
        data={data}
        answer={answer}
        locale={locale}
        readonly={readonly}
        onChange={onChange}
      />
    );
  }

  return (
    <Mathfield
      module={module}
      data={data}
      answer={answer}
      outcomes={outcomes}
      locale={locale}
      readonly={readonly}
      onChange={onChange}
    />
  );
};

/** The mathfield itself, once MathLive is known to be there. */
const Mathfield = ({
  module,
  data,
  answer,
  outcomes,
  locale,
  readonly,
  onChange,
}: {
  module: MathfieldModule;
  data: Data;
  answer: Answer;
  outcomes?: BlankOutcome[];
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const host = useRef<HTMLDivElement>(null);
  const field = useRef<(HTMLElement & MathfieldApi) | null>(null);
  const blanks = hasBlanks(data);
  const names = answerNamesIn(data.latex);
  const id = useId();

  /**
   * The answer as the component last wrote it out.
   *
   * A mathfield is uncontrolled — it owns a cursor, a selection and a
   * half-typed command — so assigning `value` on every render would move the
   * caret while somebody is typing. This is what lets the effect below tell
   * "the answer changed underneath us" from "we are hearing our own change
   * back".
   */
  const ours = useRef<string>("");

  /**
   * Everything `report` needs, refreshed every render.
   *
   * The field is built once and its `input` listener with it, so anything that
   * listener closes over is frozen at the moment of mounting. `onChange` is a
   * new function on every render, and the template's shape changes whenever an
   * author edits it — a listener holding the first of each would report a
   * two-blank answer for a one-box formula, and hand it to a callback nobody
   * is listening to any more.
   */
  const latest = useRef({ onChange, blanks, names });
  useEffect(() => {
    latest.current = { onChange, blanks, names };
  });

  // Built once and kept: re-creating the element on a re-render would take the
  // focus, the cursor and any open keyboard with it.
  useEffect(() => {
    if (!host.current || field.current) return;

    const element = new module.MathfieldElement();
    element.mathVirtualKeyboardPolicy = data.virtualKeyboard ? "auto" : "manual";
    element.className = "bitflow-math-field";
    element.setAttribute("aria-label", t("answerLabel"));

    if (blanks) {
      // The template is the question; only the gaps are the answer.
      element.readOnly = true;
      element.value = data.latex;
      for (const name of names) {
        element.setPromptValue(name, answer.prompts[name] ?? "");
      }
    } else {
      element.value = answer.prompts[SINGLE_BLANK] ?? "";
    }

    const report = () => {
      const now = latest.current;
      const prompts: Record<string, string> = now.blanks
        ? Object.fromEntries(
            now.names.map((name) => [name, element.getPromptValue(name)]),
          )
        : { [SINGLE_BLANK]: element.value };
      ours.current = JSON.stringify(prompts);
      now.onChange({ prompts });
    };

    element.addEventListener("input", report);
    host.current.append(element);
    // After it is in the document, so its shadow root exists to style.
    thinIncorrectStrike(element);
    field.current = element;

    return () => {
      element.removeEventListener("input", report);
      element.remove();
      field.current = null;
    };
    // Rebuilt only when the template itself changes, which is an authoring
    // event — a learner's `data` is fixed for the life of the step. Everything
    // else that changes per render is read through `latest` instead, because
    // rebuilding takes the caret, the selection and any open keyboard with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, data.latex]);

  // Answer changed from outside — a resume, or the host clearing it. Write it
  // back only when it is not the change we just announced, or the caret jumps
  // to the end on every keystroke.
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    const incoming = JSON.stringify(
      Object.fromEntries(names.map((name) => [name, answer.prompts[name] ?? ""])),
    );
    if (incoming === ours.current) return;
    ours.current = incoming;

    if (blanks) {
      for (const name of names) element.setPromptValue(name, answer.prompts[name] ?? "");
    } else {
      element.value = answer.prompts[SINGLE_BLANK] ?? "";
    }
  }, [answer, blanks, names]);

  // Readonly is the checked state, and a checked answer must not be editable.
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    if (blanks) {
      for (const name of names) {
        const outcome = outcomes?.find((entry) => entry.name === name);
        element.setPromptState(
          name,
          outcome === undefined ? "undefined" : outcome.correct ? "correct" : "incorrect",
          readonly === true,
        );
      }
    } else {
      element.readOnly = readonly === true;
    }
  }, [readonly, outcomes, blanks, names]);

  const right = outcomes?.filter((outcome) => outcome.correct).length;

  return (
    <div className="bitflow-math">
      {!blanks && (
        <label className="bitflow-label" htmlFor={id}>
          {t("answerLabel")}
        </label>
      )}
      <div className="bitflow-math-host" ref={host} id={id} />
      {!readonly && <p className="bitflow-hint">{t("keyboardHint")}</p>}

      {/*
        The per-blank marks are drawn inside the field by `setPromptState`,
        which is colour and a border — so the same thing is said in words here,
        where a screen reader and a learner who does not see the tint both get
        it.
      */}
      {outcomes && (
        <p className="bitflow-math-outcomes" role="status">
          {t("scoreLine", { right: right ?? 0, total: outcomes.length })}
          {blanks && (
            <>
              {" "}
              {outcomes
                .map(
                  (outcome) =>
                    `${t("blankLabel", { name: outcome.name })}: ${
                      outcome.correct ? t("blankRight") : t("blankWrong")
                    }`,
                )
                .join(". ")}
            </>
          )}
        </p>
      )}
    </div>
  );
};

/**
 * What is offered when MathLive is not there.
 *
 * LaTeX in a text box — which is not a consolation prize but the same answer
 * in the same notation: a mathfield's value *is* LaTeX, so an answer typed
 * here is the answer the marking expects, byte for byte. Somebody who knows
 * LaTeX is not blocked, and everybody else at least sees why they are stuck
 * rather than an empty rectangle.
 */
const LatexFallback = ({
  data,
  answer,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const id = useId();
  const names = answerNamesIn(data.latex);

  return (
    <div className="bitflow-math">
      <p className="bitflow-math-status" role="status">
        {t("unavailable")}
      </p>
      {names.map((name) => (
        <div className="bitflow-field" key={name}>
          <label className="bitflow-label" htmlFor={`${id}-${name}`}>
            {name === SINGLE_BLANK
              ? t("latexLabel")
              : translate(messages, "blankLabel", locale, { name })}
          </label>
          <input
            id={`${id}-${name}`}
            className="bitflow-input"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={answer.prompts[name] ?? ""}
            disabled={readonly}
            onChange={(event) =>
              onChange({
                prompts: { ...answer.prompts, [name]: event.target.value },
              })
            }
          />
          <span className="bitflow-hint">{t("latexHint")}</span>
        </div>
      ))}
    </div>
  );
};
