import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  CheckboxField,
  Disclosure,
  errorFor,
  EvaluationFields,
  Field,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import { useId, type ReactElement } from "react";
import type { Reason } from "./evaluate";
import { formMessages } from "./formMessages";
import { messages } from "./messages";
import {
  asDecimal,
  digitsNeeded,
  read,
  REPRESENTATIONS,
  type Representation,
} from "./numbers";
import {
  answerOptions,
  DataSchema,
  expectedWritten,
  ScoringSchema,
  type Answer,
  type Data,
  type Scoring,
} from "./schema";

/** `hex` → `hexWord`, the word for a representation in a sentence. */
const word = (
  representation: Representation,
  t: (key: string) => string,
): string => t(`${representation}Word`);

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const id = useId();

  const target = word(data.targetRepresentation, t);
  const digits = digitsNeeded(data.bitWidth, data.targetRepresentation);
  const reading = read(answer?.raw ?? "", data.targetRepresentation, answerOptions(data));
  const reason = result?.detail?.reason as Reason | undefined;

  const hints = [
    data.requireFullWidth && digits > 0 ? t("fullWidthHint", { digits }) : "",
    data.allowPrefix && data.targetRepresentation !== "text" ? t("prefixHint") : "",
    data.allowSeparators && data.targetRepresentation !== "text"
      ? t("separatorHint")
      : "",
  ].filter(Boolean);

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />

      <div className="bitflow-number-given">
        <span className="bitflow-label">{t("givenLabel")}</span>
        <span className="bitflow-number-value">{data.sourceValue}</span>
        <span className="bitflow-hint">
          {t("inRepresentation", {
            representation: word(data.sourceRepresentation, t),
          })}
          {data.bitWidth > 0 &&
            ` · ${t("widthNote", {
              bits: data.bitWidth,
              sign: t(data.signed ? "signSigned" : "signUnsigned"),
            })}`}
        </span>
      </div>

      <p className="bitflow-text-muted">
        {readonly ? t("howToReadonly") : t("howTo", { target })}
      </p>

      <div className="bitflow-field">
        <label className="bitflow-label" htmlFor={id}>
          {t("answerLabel", { target })}
        </label>
        {hints.map((hint) => (
          <span key={hint} className="bitflow-hint">
            {hint}
          </span>
        ))}
        <input
          id={id}
          type="text"
          className={[
            "bitflow-input",
            "bitflow-number-input",
            result?.state === "correct" ? "bitflow-number-input-correct" : "",
            result?.state === "wrong" ? "bitflow-number-input-wrong" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          /*
           * `hex` needs A–F as well as digits, so it gets the same text
           * keyboard as `text` rather than the digits-only pad `numeric`
           * brings up — that pad has no letters at all, and a hex answer
           * would be untypeable on a phone. `decimal`, `binary` and `octal`
           * are digits only, so `numeric` is the right, smaller keyboard for
           * them.
           */
          inputMode={
            data.targetRepresentation === "text" || data.targetRepresentation === "hex"
              ? "text"
              : "numeric"
          }
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={answer?.raw ?? ""}
          disabled={readonly}
          onChange={(event) => onAnswerChange({ raw: event.target.value })}
        />
        {/* This is the one task type where the thing marked is not the thing
            typed, so what it makes of what was typed is shown as it is typed. */}
        <p className="bitflow-hint" aria-live="polite">
          {(answer?.raw ?? "").trim() === ""
            ? ""
            : reading.ok
              ? t("reading", { value: asDecimal(reading.values) })
              : t("readingUnreadable", { target })}
        </p>
      </div>

      {reason && (
        <p
          className={
            reason === "correct"
              ? "bitflow-alert bitflow-alert-success"
              : "bitflow-alert bitflow-alert-warning"
          }
        >
          {t(reasonKey(reason), { target, bits: data.bitWidth, digits })}
        </p>
      )}
    </div>
  );
};

/** `notFullWidth` → `reasonNotFullWidth`. */
const reasonKey = (reason: Reason): string =>
  `reason${reason[0].toUpperCase()}${reason.slice(1)}`;

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const options = REPRESENTATIONS.map((representation) => ({
    value: representation as Representation,
    label: t(
      `representation${representation[0].toUpperCase()}${representation.slice(1)}`,
    ),
  }));

  // Read through the schema so the preview is what will actually be accepted,
  // rather than a second opinion computed from half-edited data.
  const parsed = DataSchema.safeParse(data);
  const written = parsed.success ? expectedWritten(parsed.data) : "";

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <SelectField
        label={t("sourceRepresentationLabel")}
        value={data.sourceRepresentation}
        options={options}
        onChange={(sourceRepresentation) => patch({ sourceRepresentation })}
      />

      <TextField
        label={t("sourceValueLabel")}
        hint={t("sourceValueHint")}
        value={data.sourceValue}
        error={errorFor(errors, "sourceValue")}
        onChange={(sourceValue) => patch({ sourceValue })}
      />

      <SelectField
        label={t("targetRepresentationLabel")}
        value={data.targetRepresentation}
        options={options}
        error={errorFor(errors, "targetRepresentation")}
        onChange={(targetRepresentation) => patch({ targetRepresentation })}
      />

      <Field label={t("bitWidthLabel")} hint={t("bitWidthHint")}>
        {(props) => (
          <input
            {...props}
            type="number"
            className="bitflow-input"
            min={0}
            max={64}
            step={1}
            value={data.bitWidth}
            onChange={(event) =>
              patch({
                bitWidth: Math.min(
                  64,
                  Math.max(0, Math.round(Number(event.target.value) || 0)),
                ),
              })
            }
          />
        )}
      </Field>

      <CheckboxField
        label={t("signedLabel")}
        hint={t("signedHint")}
        checked={data.signed}
        onChange={(signed) => patch({ signed })}
      />

      <div className="bitflow-field">
        <span className="bitflow-label">{t("expectedLabel")}</span>
        <span className="bitflow-hint">{t("expectedHint")}</span>
        <span className="bitflow-number-value">
          {written === "" ? t("expectedNone") : written}
        </span>
      </div>

      <Disclosure summary={t("advanced")}>
        <CheckboxField
          label={t("requireFullWidthLabel")}
          hint={t("requireFullWidthHint")}
          checked={data.requireFullWidth}
          onChange={(requireFullWidth) => patch({ requireFullWidth })}
        />
        <CheckboxField
          label={t("allowPrefixLabel")}
          checked={data.allowPrefix}
          onChange={(allowPrefix) => patch({ allowPrefix })}
        />
        <CheckboxField
          label={t("allowSeparatorsLabel")}
          hint={t("allowSeparatorsHint")}
          checked={data.allowSeparators}
          onChange={(allowSeparators) => patch({ allowSeparators })}
        />
        {errorFor(errors, "allowSeparators") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "allowSeparators")}
          </span>
        )}
        <SelectField
          label={t("scoringLabel")}
          hint={t("scoringHint")}
          value={data.scoring}
          options={ScoringSchema.options.map((scoring) => ({
            value: scoring as Scoring,
            label: t(`scoring${scoring[0].toUpperCase()}${scoring.slice(1)}`),
          }))}
          error={errorFor(errors, "scoring")}
          onChange={(scoring) => patch({ scoring })}
        />
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
