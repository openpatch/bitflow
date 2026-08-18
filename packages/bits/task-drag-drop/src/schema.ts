import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A fraction of the background image's width or height.
 *
 * Never pixels: the image is responsive, and a zone authored against a
 * 1200px-wide screenshot has to land in the same place on a phone. Storing
 * fractions means the picture can be re-exported at another size without
 * every zone moving.
 */
const Fraction = z.number().min(0).max(1);

export const BackgroundSchema = z.object({
  src: z.string().default(""),
  /**
   * Required whenever there is an image. The picture carries the whole task,
   * so a learner who cannot see it has nothing at all without this.
   */
  alt: z.string().default(""),
});

export const ItemSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same label. */
  id: z.string().min(1),
  kind: z.enum(["text", "image"]).default("text"),
  /** The visible text, or the alternative text when `kind` is `image`. */
  label: z.string().default(""),
  /** Only read for `kind: "image"`. */
  src: z.string().optional(),
});
export type Item = z.infer<typeof ItemSchema>;

export const ZoneSchema = z.object({
  id: z.string().min(1),
  /**
   * Names the region in words. Not decoration: it is the zone's accessible
   * name, the thing a keyboard user chooses from, and the only description of
   * the region for anyone not looking at the image.
   */
  label: z.string().default(""),
  rect: z.object({
    x: Fraction,
    y: Fraction,
    width: Fraction,
    height: Fraction,
  }),
  /** Items that count as correctly placed here. */
  acceptedItemIds: z.array(z.string()).default([]),
  /** What this zone is worth. Zones can be weighted against each other. */
  score: z.number().min(0).default(1),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    background: BackgroundSchema.default({ src: "", alt: "" }),
    items: z.array(ItemSchema).default([]),
    zones: z.array(ZoneSchema).default([]),
    /**
     * Whether one label can be dropped into several zones. Off by default:
     * "put each label where it belongs" is the usual task, and allowing
     * reuse turns a labelling exercise into a different one.
     */
    allowMultiplePlacements: z.boolean().default(false),
    /** Award a fraction for a partly-right answer instead of all-or-nothing. */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const itemIds = ctx.value.items.map((item) => item.id);
    if (new Set(itemIds).size !== itemIds.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.items,
        path: ["items"],
        message: "Each label needs its own id.",
      });
    }

    const zoneIds = ctx.value.zones.map((zone) => zone.id);
    if (new Set(zoneIds).size !== zoneIds.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.zones,
        path: ["zones"],
        message: "Each region needs its own id.",
      });
    }

    // The image is the task. Without alternative text the task does not exist
    // for part of the class, and that is not something to discover afterwards.
    if (ctx.value.background.src && !ctx.value.background.alt.trim()) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.background,
        path: ["background", "alt"],
        message: "Describe the image. Learners using a screen reader have only this.",
      });
    }

    ctx.value.zones.forEach((zone, index) => {
      if (!zone.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: zone,
          path: ["zones", index, "label"],
          message:
            "Name this region. It is how the region is announced and how it is chosen without a mouse.",
        });
      }

      // A region hanging off the edge cannot be clicked in full, and the
      // author cannot see that from the numbers.
      if (zone.rect.x + zone.rect.width > 1 || zone.rect.y + zone.rect.height > 1) {
        ctx.issues.push({
          code: "custom",
          input: zone.rect,
          path: ["zones", index, "rect"],
          message: "This region runs off the edge of the image.",
        });
      }

      for (const itemId of zone.acceptedItemIds) {
        if (!itemIds.includes(itemId)) {
          ctx.issues.push({
            code: "custom",
            input: zone.acceptedItemIds,
            path: ["zones", index, "acceptedItemIds"],
            message: `This region accepts "${itemId}", which is not one of the labels.`,
          });
        }
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    // Every guardrail below is about a task that runs but cannot be answered
    // correctly — the author would only find out by taking it themselves.
    if (ctx.value.items.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.items,
        path: ["items"],
        message: "Add at least one label for the learner to place.",
      });
    }
    if (ctx.value.zones.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.zones,
        path: ["zones"],
        message: "Add at least one region to drop labels into.",
      });
    }

    const graded = ctx.value.zones.filter((zone) => zone.acceptedItemIds.length > 0);
    if (ctx.value.zones.length > 0 && graded.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.zones,
        path: ["zones"],
        message:
          "No region accepts any label, so no answer can be right. Say which label belongs where, or switch grading off.",
      });
    }

    if (!ctx.value.allowMultiplePlacements) {
      // With reuse off, a label wanted by two zones can only ever satisfy one.
      const wantedBy = new Map<string, number>();
      for (const zone of ctx.value.zones) {
        for (const itemId of new Set(zone.acceptedItemIds)) {
          wantedBy.set(itemId, (wantedBy.get(itemId) ?? 0) + 1);
        }
      }
      for (const [itemId, count] of wantedBy) {
        if (count > 1) {
          ctx.issues.push({
            code: "custom",
            input: ctx.value.zones,
            path: ["zones"],
            message: `"${itemId}" is accepted by ${count} regions, but a label can only be placed once. Allow reuse, or accept it in one region.`,
          });
        }
      }
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const PlacementSchema = z.object({
  itemId: z.string().min(1),
  zoneId: z.string().min(1),
});
export type Placement = z.infer<typeof PlacementSchema>;

export const AnswerSchema = z.object({
  /**
   * Which label sits in which region — ids, never coordinates. A dropped
   * pixel position would have to be re-tested against the zones on every
   * screen size, and would grade differently on a phone.
   */
  placements: z.array(PlacementSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Per-zone outcome, surfaced in `BitResult.detail.zones`. */
export type ZoneState = "correct" | "wrong" | "empty" | "neutral";
