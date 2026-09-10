import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Field,
  Markdown,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  isFollowableUrl,
  isSendableOrigin,
  MESSAGE_TYPE,
  type Data,
} from "./schema";

type SendState =
  | "idle"
  | "sending"
  | "sent"
  | "failed"
  | "misconfigured"
  /** Nothing framed this page, so there is no host to hand anything to. */
  | "unframed";

/**
 * Whether there is a page around this one at all.
 *
 * `window.parent` is the window itself when nothing framed it, so posting
 * would deliver to this same page and report success — the one lie this screen
 * must not tell.
 */
const isFramed = (): boolean =>
  typeof window !== "undefined" && window.parent !== window.self;

/**
 * The closing screen that gives the run back to whatever is hosting it.
 *
 * bitflow grades in the page and keeps nothing, so for an embedded assessment
 * this is the moment the result leaves the tab. The learner is told whether it
 * got out, because if it did not, this tab is the only place their work exists.
 */
export const Task = ({
  data,
  locale,
  readonly,
  attempt,
}: BitTaskProps<Data>): ReactElement => {
  const t = (key: string) => translate(messages, key, locale);
  const [state, setState] = useState<SendState>("idle");
  /** The attempt already sent, so a re-render does not send it again. */
  const sent = useRef<string | null>(null);

  const send = () => {
    if (!attempt) return;
    if (!isSendableOrigin(data.messageOrigin)) {
      setState("misconfigured");
      return;
    }
    if (!isFramed()) {
      setState("unframed");
      return;
    }

    setState("sending");
    try {
      // `parent` rather than `top`: the host is whatever framed this, and a
      // page nested two deep is somebody else's business.
      window.parent.postMessage(
        { type: MESSAGE_TYPE, attempt },
        data.messageOrigin.trim(),
      );
      sent.current = attempt.attemptId;
      setState("sent");
    } catch {
      // Only something the structured clone could not carry gets here. An
      // origin that does not match the page on the other side does *not*
      // throw: the browser discards the message in silence, and nothing comes
      // back to say so. So "sent" means posted, and the wording says as much
      // rather than promising an arrival nobody can confirm — there is no ack
      // in this protocol to wait for.
      setState("failed");
    }
  };

  useEffect(() => {
    if (!data.postMessage || readonly || !attempt) return;
    if (sent.current === attempt.attemptId) return;
    send();
    // Keyed on the attempt rather than on `send`, which is a fresh closure on
    // every render: depending on it would post the same result on every
    // redraw. The `sent` ref is the belt to this brace.
  }, [data.postMessage, data.messageOrigin, readonly, attempt?.attemptId]);

  return (
    <div className="bitflow-stack">
      {data.title && <h2 className="bitflow-heading">{data.title}</h2>}
      <Markdown markdown={data.markdown} />

      {data.postMessage && !readonly && (
        <div className="bitflow-stack-small bitflow-stack">
          {/* Announced as it changes: whether the work got out is the one
              thing on this screen that matters. */}
          <p
            className={`bitflow-handoff-state bitflow-handoff-${state}`}
            role="status"
          >
            {state === "sending" && t("sending")}
            {state === "sent" && t("sent")}
            {state === "failed" && t("failed")}
            {state === "misconfigured" && t("misconfigured")}
            {state === "unframed" && t("unframed")}
          </p>

          {state === "failed" && (
            <div>
              <button type="button" className="bitflow-button" onClick={send}>
                {t("retry")}
              </button>
            </div>
          )}
        </div>
      )}

      {isFollowableUrl(data.continueUrl) && (
        <p>
          {/* An ordinary link they choose to follow, not a redirect. Being
              moved off the page that says whether your work was saved is not
              something to do to somebody. Rendered only when the address is
              one a browser should follow — see `isFollowableUrl`. */}
          <a className="bitflow-handoff-link" href={data.continueUrl.trim()}>
            {data.continueLabel || t("continueFallback")}
          </a>
        </p>
      )}
    </div>
  );
};

export const Form = ({
  data,
  locale,
  onChange,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  // Said here rather than only in the problems list: the address is the one
  // field on this form where a typo silently means "nothing was ever sent".
  const originProblem =
    data.postMessage &&
    data.messageOrigin.trim() !== "" &&
    !isSendableOrigin(data.messageOrigin)
      ? t("originInvalid")
      : undefined;
  // Said on the field rather than only refused at render time: a link that
  // silently does not appear looks like the bit is broken.
  const linkProblem =
    data.continueUrl.trim() !== "" && !isFollowableUrl(data.continueUrl)
      ? t("continueUrlInvalid")
      : undefined;

  return (
    <div className="bitflow-stack">
      <TextField
        label={t("titleLabel")}
        value={data.title}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TextAreaField
        label={t("markdownLabel")}
        hint={t("markdownHint")}
        value={data.markdown}
        onChange={(markdown) => onChange({ ...data, markdown })}
      />
      <CheckboxField
        label={t("postMessageLabel")}
        hint={t("postMessageHint")}
        checked={data.postMessage}
        onChange={(postMessage) => onChange({ ...data, postMessage })}
      />
      {data.postMessage && (
        <Field
          label={t("originLabel")}
          hint={t("originHint")}
          error={originProblem}
        >
          {(props) => (
            <input
              {...props}
              type="url"
              className="bitflow-input"
              placeholder="https://school.example"
              value={data.messageOrigin}
              onChange={(event) =>
                onChange({ ...data, messageOrigin: event.target.value })
              }
            />
          )}
        </Field>
      )}
      <TextField
        label={t("continueUrlLabel")}
        hint={t("continueUrlHint")}
        error={linkProblem}
        value={data.continueUrl}
        onChange={(continueUrl) => onChange({ ...data, continueUrl })}
      />
      <TextField
        label={t("continueLabelLabel")}
        hint={t("continueLabelHint")}
        value={data.continueLabel}
        onChange={(continueLabel) => onChange({ ...data, continueLabel })}
      />
    </div>
  );
};
