import { translate, type BitFormProps, type BitTaskProps } from "@bitflow/core";
import {
  Disclosure,
  errorFor,
  EvaluationFields,
  ImageField,
  Markdown,
  SelectField,
  TextAreaField,
  TextField,
  usePanels,
} from "@bitflow/element";
import { useMemo, type ReactElement } from "react";
import { Columns } from "./Columns";
import { formMessages } from "./formMessages";
import type { Answer, Data, Match, Pair, Side } from "./schema";
import { seededShuffle } from "./shuffle";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  attempt,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const ids = data.pairs.map((pair) => pair.id);
  const seed = attempt?.attemptId ?? "bitflow";

  /*
   * Each column is shuffled on its own, or the pairs would line up across the
   * two and the task would be "match row one to row one". Seeded from the
   * attempt so a reload does not deal a new hand around the matches the
   * learner has already made.
   */
  const leftOrder = useMemo(
    () => seededShuffle(ids, `${seed}:left`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(), seed],
  );
  const rightOrder = useMemo(
    () => seededShuffle(ids, `${seed}:right`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(), seed],
  );

  // An answer written before the author removed a pair would name a card that
  // is gone, so it is filtered against what exists now.
  const matches = (answer?.matches ?? []).filter(
    (match) => ids.includes(match.leftId) && ids.includes(match.rightId),
  );

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <Columns
        pairs={data.pairs}
        leftOrder={leftOrder}
        rightOrder={rightOrder}
        matches={matches}
        results={
          result?.detail?.matches as Array<Match & { correct: boolean }> | undefined
        }
        locale={locale}
        readonly={readonly}
        onChange={(next) => onAnswerChange({ matches: next })}
      />
    </div>
  );
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `pair-${n}`;
    if (!taken.includes(id)) return id;
  }
};

export const Form = ({
  data,
  locale,
  onChange,
  errors,
}: BitFormProps<Data>): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(formMessages, key, locale, vars);
  const patch = (changes: Partial<Data>) => onChange({ ...data, ...changes });

  const panels = usePanels(data.pairs.map((pair) => pair.id));

  const setSide = (id: string, side: "left" | "right", changes: Partial<Side>) =>
    patch({
      pairs: data.pairs.map((pair) =>
        pair.id === id ? { ...pair, [side]: { ...pair[side], ...changes } } : pair,
      ),
    });

  /** One card's fields, the same on either side of the pair. */
  const cardFields = (pair: Pair, side: "left" | "right", index: number) => {
    const value = pair[side];
    return (
      <fieldset className="bitflow-field">
        <legend className="bitflow-label">
          {t(side === "left" ? "leftLabel" : "rightLabel")}
        </legend>

        <SelectField
          label={t("kind")}
          value={value.kind}
          options={[
            { value: "text" as const, label: t("kindText") },
            { value: "image" as const, label: t("kindImage") },
          ]}
          onChange={(kind) =>
            setSide(pair.id, side, {
              kind,
              image:
                kind === "image" ? (value.image ?? { src: "", alt: "" }) : value.image,
            })
          }
        />

        {value.kind === "image" ? (
          <ImageField
            value={{ src: value.image?.src ?? "", alt: value.label }}
            locale={locale}
            label={t("cardPicture")}
            altHint={t("cardPictureAltHint")}
            altError={errorFor(errors, `pairs.${index}.${side}.label`)}
            error={errorFor(errors, `pairs.${index}.${side}.image`)}
            onChange={(image) =>
              setSide(pair.id, side, {
                image: { src: image.src, alt: image.alt },
                label: image.alt,
              })
            }
          />
        ) : (
          <TextField
            label={t("cardText")}
            value={value.label}
            error={errorFor(errors, `pairs.${index}.${side}.label`)}
            onChange={(label) => setSide(pair.id, side, { label })}
          />
        )}
      </fieldset>
    );
  };

  return (
    <div className="bitflow-stack">
      <TextAreaField
        label={t("instructionLabel")}
        hint={t("instructionHint")}
        rows={2}
        value={data.instruction}
        onChange={(instruction) => patch({ instruction })}
      />

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("pairsLabel")}</legend>
        <span className="bitflow-hint">{t("pairsHint")}</span>
        {errorFor(errors, "pairs") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "pairs")}
          </span>
        )}
        {data.pairs.length === 0 && (
          <p className="bitflow-text-muted">{t("noPairs")}</p>
        )}

        {data.pairs.map((pair, index) => (
          <div key={pair.id} className="bitflow-rule">
            <Disclosure
              {...panels.props(pair.id)}
              summary={
                pair.left.label || pair.right.label
                  ? t("pairSummary", {
                      left: pair.left.label || "…",
                      right: pair.right.label || "…",
                    })
                  : t("unnamedPair")
              }
            >
              {cardFields(pair, "left", index)}
              {cardFields(pair, "right", index)}

              <button
                type="button"
                className="bitflow-button bitflow-button-quiet"
                onClick={() =>
                  patch({
                    pairs: data.pairs.filter((other) => other.id !== pair.id),
                  })
                }
              >
                {t("remove")}
              </button>
            </Disclosure>
          </div>
        ))}

        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() =>
            patch({
              pairs: [
                ...data.pairs,
                {
                  id: newId(data.pairs.map((pair) => pair.id)),
                  left: { kind: "text" as const, label: "" },
                  right: { kind: "text" as const, label: "" },
                },
              ],
            })
          }
        >
          {t("addPair")}
        </button>
      </fieldset>

      <Disclosure summary={t("advanced")}>
        <EvaluationFields
          evaluation={data.evaluation}
          locale={locale}
          onChange={(evaluation) => patch({ evaluation })}
        />
      </Disclosure>
    </div>
  );
};
