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
import { formMessages } from "./formMessages";
import type { Answer, Data, Item } from "./schema";
import { Sequence } from "./Sequence";
import { shuffledAwayFrom } from "./shuffle";

export const Task = ({
  data,
  answer,
  result,
  readonly,
  locale,
  attempt,
  onAnswerChange,
}: BitTaskProps<Data, Answer>): ReactElement => {
  const ids = data.items.map((item) => item.id);

  /**
   * The order the learner starts from.
   *
   * Seeded from the attempt so it survives a reload — coming back to find the
   * items rearranged around what you had already moved would be worse than no
   * shuffle at all — and differs between learners without being stored
   * anywhere. Only used until they move something; after that the answer is
   * the order.
   */
  const shuffled = useMemo(
    () =>
      shuffledAwayFrom(
        ids,
        attempt?.attemptId ?? "bitflow",
        (a, b) => a.join() === b.join(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(), attempt?.attemptId],
  );

  // An answer written before the author added or removed an item would leave
  // the list short or holding a ghost, so it is reconciled against the items.
  const order = reconcile(answer?.order ?? shuffled, ids);

  return (
    <div className="bitflow-stack">
      <Markdown markdown={data.instruction} />
      <Sequence
        items={data.items}
        order={order}
        correct={result?.detail?.correct as string[] | undefined}
        locale={locale}
        readonly={readonly}
        onReorder={(next) => onAnswerChange({ order: next })}
      />
    </div>
  );
};

/** Keeps every item exactly once, in the learner's order where it is known. */
const reconcile = (order: string[], ids: string[]): string[] => {
  const known = order.filter((id) => ids.includes(id));
  return [...known, ...ids.filter((id) => !known.includes(id))];
};

/** A fresh id that will not collide with one the author already used. */
const newId = (taken: string[]): string => {
  for (let n = taken.length + 1; ; n++) {
    const id = `item-${n}`;
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

  const panels = usePanels(data.items.map((item) => item.id));

  const setItem = (id: string, changes: Partial<Item>) =>
    patch({
      items: data.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= data.items.length) return;
    const items = [...data.items];
    [items[index], items[to]] = [items[to], items[index]];
    patch({ items });
  };

  const add = (kind: Item["kind"]) =>
    patch({
      items: [
        ...data.items,
        {
          id: newId(data.items.map((item) => item.id)),
          kind,
          label: "",
          ...(kind === "image" ? { image: { src: "", alt: "" } } : {}),
        },
      ],
    });

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
        <legend className="bitflow-label">{t("itemsLabel")}</legend>
        <span className="bitflow-hint">{t("itemsHint")}</span>
        {errorFor(errors, "items") && (
          <span className="bitflow-field-error" role="alert">
            {errorFor(errors, "items")}
          </span>
        )}
        {data.items.length === 0 && (
          <p className="bitflow-text-muted">{t("noItems")}</p>
        )}

        {data.items.map((item, index) => (
          <div key={item.id} className="bitflow-rule">
            <Disclosure
              {...panels.props(item.id)}
              summary={item.label || t("unnamedItem")}
              aside={t("position", { position: index + 1 })}
            >
              <SelectField
                label={t("itemKind")}
                value={item.kind}
                options={[
                  { value: "text" as const, label: t("addText") },
                  { value: "image" as const, label: t("addImage") },
                ]}
                onChange={(kind) =>
                  setItem(item.id, {
                    kind,
                    image:
                      kind === "image"
                        ? (item.image ?? { src: "", alt: "" })
                        : item.image,
                  })
                }
              />

              {item.kind === "image" ? (
                <ImageField
                  value={{ src: item.image?.src ?? "", alt: item.label }}
                  locale={locale}
                  label={t("itemPicture")}
                  altHint={t("itemPictureAltHint")}
                  altError={errorFor(errors, `items.${index}.label`)}
                  error={errorFor(errors, `items.${index}.image`)}
                  onChange={(image) =>
                    setItem(item.id, {
                      image: { src: image.src, alt: image.alt },
                      label: image.alt,
                    })
                  }
                />
              ) : (
                <TextField
                  label={t("itemText")}
                  value={item.label}
                  error={errorFor(errors, `items.${index}.label`)}
                  onChange={(label) => setItem(item.id, { label })}
                />
              )}

              <div className="bitflow-row">
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  {t("moveUp")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  disabled={index === data.items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  {t("moveDown")}
                </button>
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  onClick={() =>
                    patch({
                      items: data.items.filter((other) => other.id !== item.id),
                    })
                  }
                >
                  {t("remove")}
                </button>
              </div>
            </Disclosure>
          </div>
        ))}

        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => add("text")}
          >
            {t("addText")}
          </button>
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => add("image")}
          >
            {t("addImage")}
          </button>
        </div>
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
