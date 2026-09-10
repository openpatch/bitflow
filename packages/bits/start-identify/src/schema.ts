import { createId } from "@bitflow/core";
import { z } from "zod";

/**
 * One thing the learner is asked before starting.
 *
 * `select` exists for the answers that come from a fixed list — a class, a
 * group, a session — where free text produces "7b", "7B" and "Klasse 7b" for
 * the same twenty people and nothing lines up in the report afterwards.
 */
export const FieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(""),
  hint: z.string().default(""),
  required: z.boolean().default(true),
  kind: z.enum(["text", "select"]).default("text"),
  /** Only for `select`. Ignored otherwise. */
  options: z.array(z.string()).default([]),
});
export type Field = z.infer<typeof FieldSchema>;

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  fields: z.array(FieldSchema).default([]),
});
export type Data = z.infer<typeof DataSchema>;

/** Field id → what the learner typed or chose. */
export type Answer = Record<string, string>;

export const newField = (): Field => ({
  id: createId("field"),
  label: "",
  hint: "",
  required: true,
  kind: "text",
  options: [],
});

/**
 * Every required field has something in it.
 *
 * Trimmed, so a space is not a name. A field with no label is not required of
 * anyone whatever it says: the learner cannot answer a question that was never
 * asked, and holding them at a blank box is the worst possible dead end.
 */
export const isFilledIn = (data: Data, answer: Answer | undefined): boolean =>
  data.fields.every(
    (field) =>
      !field.required ||
      field.label.trim() === "" ||
      (answer?.[field.id] ?? "").trim() !== "",
  );

/**
 * The learner's own name for themselves, for whatever wants to label a row
 * with it. The first field that has an answer, in the order they were asked —
 * which is the one an author puts first for exactly this reason.
 */
export const identityOf = (
  data: Data,
  answer: Answer | undefined,
): string | undefined => {
  for (const field of data.fields) {
    const value = (answer?.[field.id] ?? "").trim();
    if (value !== "") return value;
  }
  return undefined;
};
