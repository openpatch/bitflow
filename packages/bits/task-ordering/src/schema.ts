import { defaultEvaluation, EvaluationSchema, ImageSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Modelled on H5P's Image Sequencing: the order the author writes is the right
 * order, the learner is given the items shuffled, and every item that ends up
 * in its authored place is worth a point.
 *
 * Widened to text as well as pictures. H5P's is images only, but the same task
 * is how you ask for the steps of an algorithm or the stages of a process, and
 * bitflow has no reason to make a teacher screenshot a sentence.
 */

export const ItemSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same item. */
  id: z.string().min(1),
  kind: z.enum(["text", "image"]).default("text"),
  /**
   * The words on the item, or — for a picture — what the picture shows. One
   * field either way, so an image can never be shipped undescribed.
   */
  label: z.string().default(""),
  image: ImageSchema.optional(),
});
export type Item = z.infer<typeof ItemSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    /**
     * In the order they belong. The learner never sees this order; it is the
     * answer.
     */
    items: z.array(ItemSchema).default([]),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const ids = ctx.value.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.items,
        path: ["items"],
        message: "Each item needs its own id.",
      });
    }

    ctx.value.items.forEach((item, index) => {
      if (!item.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: item,
          path: ["items", index, "label"],
          message:
            item.kind === "image"
              ? "Describe this picture. It is the item's only name for anyone who cannot see it."
              : "Give this item some text.",
        });
      }
      if (item.kind === "image" && !item.image?.src) {
        ctx.issues.push({
          code: "custom",
          input: item,
          path: ["items", index, "image"],
          message: "Choose a picture for this item, or make it a text item.",
        });
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    // Two items is a coin toss dressed as a task, and one is not a task at
    // all. H5P asks for three for the same reason.
    if (ctx.value.items.length < 3) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.items,
        path: ["items"],
        message: "Add at least three items. Fewer than that is not an ordering.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /**
   * The item ids in the order the learner has put them.
   *
   * Ids rather than positions, so an answer survives the author reordering or
   * renaming the items — and so a stale answer referring to a deleted item is
   * something the runtime can notice rather than silently misread.
   */
  order: z.array(z.string()).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;
