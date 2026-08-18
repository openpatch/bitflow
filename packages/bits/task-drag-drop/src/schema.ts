import { defaultEvaluation, EvaluationSchema, ImageSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * Modelled on H5P's Drag and Drop question, so a teacher who knows that tool
 * meets the same ideas here: draggables sitting on the picture rather than in
 * a tray, a separate say over where each one *may* go and where it *belongs*,
 * elements that clone themselves, zones that hold one thing, and penalties for
 * putting something in the wrong place.
 *
 * The one departure is units. H5P authors against a fixed play area in pixels
 * and scales the whole thing; positions here are fractions of the play area,
 * which comes to the same picture without a magic number in every coordinate.
 */

/** A fraction of the play area's width or height. */
const Fraction = z.number().min(0).max(1);

/**
 * The picture behind the task, stored inside the document.
 *
 * `ImageSchema` is shared: a `.bitflow` file is mailed, synced and opened
 * offline, and a linked picture breaks on every one of those journeys.
 */
export const BackgroundSchema = ImageSchema;

/**
 * The play area's shape. Only its ratio is used — everything inside is
 * positioned in fractions — but authors think in a canvas size, and H5P files
 * carry one, so it is kept in the same terms.
 */
export const SizeSchema = z.object({
  width: z.number().positive().default(620),
  height: z.number().positive().default(310),
});

const BoxSchema = {
  x: Fraction,
  y: Fraction,
  width: Fraction,
  height: Fraction,
};

/** 0 is invisible, 100 fully opaque. H5P's range, so imported files survive. */
const Opacity = z.number().min(0).max(100).default(100);

export const ElementSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same element. */
  id: z.string().min(1),
  kind: z.enum(["text", "image"]).default("text"),
  /** The visible text, or the alternative text when `kind` is `image`. */
  label: z.string().default(""),
  /**
   * Only read for `kind: "image"`, and embedded like the background. `label`
   * is this picture's alternative text, so there is one place to write it.
   */
  src: z.string().optional(),
  ...BoxSchema,
  /**
   * Clones the element on being dragged, so it can fill several zones. Its
   * maximum score rises accordingly: one point per zone it belongs in.
   */
  multiple: z.boolean().default(false),
  backgroundOpacity: Opacity,
});
export type Element = z.infer<typeof ElementSchema>;

export const DropZoneSchema = z.object({
  id: z.string().min(1),
  /**
   * Names the region in words.
   *
   * Never drawn for the learner — the zone is invisible, and naming it on the
   * picture would say where the answer goes. It is the author's handle on the
   * canvas, and the only way to describe the region to someone who cannot
   * see it.
   */
  label: z.string().default(""),
  ...BoxSchema,
  /** The elements that are right here. */
  correctElementIds: z.array(z.string()).default([]),
  /** A nudge available before answering. */
  tip: z.string().optional(),
  feedbackOnCorrect: z.string().optional(),
  feedbackOnIncorrect: z.string().optional(),
  backgroundOpacity: Opacity,
});
export type DropZone = z.infer<typeof DropZoneSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    background: BackgroundSchema.default({ src: "", alt: "" }),
    size: SizeSchema.default({ width: 620, height: 310 }),
    elements: z.array(ElementSchema).default([]),
    dropZones: z.array(DropZoneSchema).default([]),
    /**
     * The whole task is worth one point, all or nothing, instead of one point
     * per element in the right place.
     */
    singlePoint: z.boolean().default(false),
    /**
     * An element in the wrong zone costs a point. On by default, as in H5P,
     * and effectively required once elements can be reused: without it,
     * dropping every element into every zone scores full marks.
     */
    applyPenalties: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const elementIds = ctx.value.elements.map((element) => element.id);
    if (new Set(elementIds).size !== elementIds.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.elements,
        path: ["elements"],
        message: "Each element needs its own id.",
      });
    }

    const zoneIds = ctx.value.dropZones.map((zone) => zone.id);
    if (new Set(zoneIds).size !== zoneIds.length) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.dropZones,
        path: ["dropZones"],
        message: "Each drop zone needs its own id.",
      });
    }

    if (ctx.value.background.src && !ctx.value.background.alt.trim()) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.background,
        path: ["background", "alt"],
        message: "Describe the image. Learners using a screen reader have only this.",
      });
    }

    ctx.value.elements.forEach((element, index) => {
      if (!element.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: element,
          path: ["elements", index, "label"],
          message:
            element.kind === "image"
              ? "Describe this image. It is how the element is announced and named."
              : "Give this element some text.",
        });
      }
      if (element.x + element.width > 1 || element.y + element.height > 1) {
        ctx.issues.push({
          code: "custom",
          input: element,
          path: ["elements", index],
          message: "This element runs off the edge of the picture.",
        });
      }
    });

    ctx.value.dropZones.forEach((zone, index) => {
      if (!zone.label.trim()) {
        ctx.issues.push({
          code: "custom",
          input: zone,
          path: ["dropZones", index, "label"],
          message:
            "Name this drop zone. It is how the zone is announced and how it is chosen without a pointer.",
        });
      }
      if (zone.x + zone.width > 1 || zone.y + zone.height > 1) {
        ctx.issues.push({
          code: "custom",
          input: zone,
          path: ["dropZones", index],
          message: "This drop zone runs off the edge of the picture.",
        });
      }
      for (const elementId of zone.correctElementIds) {
        if (!elementIds.includes(elementId)) {
          ctx.issues.push({
            code: "custom",
            input: zone.correctElementIds,
            path: ["dropZones", index, "correctElementIds"],
            message: `This zone expects "${elementId}", which is not an element in this task.`,
          });
        }
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    if (ctx.value.elements.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.elements,
        path: ["elements"],
        message: "Add at least one element for the learner to move.",
      });
    }
    if (ctx.value.dropZones.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.dropZones,
        path: ["dropZones"],
        message: "Add at least one drop zone.",
      });
    }

    const anyCorrect = ctx.value.dropZones.some(
      (zone) => zone.correctElementIds.length > 0,
    );
    if (ctx.value.dropZones.length > 0 && !anyCorrect) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.dropZones,
        path: ["dropZones"],
        message:
          "No drop zone expects any element, so no answer can be right. Say what belongs where, or switch grading off.",
      });
    }

    // Without penalties, reusable elements make "drop everything everywhere"
    // a full-marks answer. H5P requires the setting for the same reason.
    if (!ctx.value.applyPenalties) {
      const reusable = ctx.value.elements.filter((element) => element.multiple);
      if (reusable.length > 0) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value.applyPenalties,
          path: ["applyPenalties"],
          message:
            "With cloning on and penalties off, dropping every element into every zone scores full marks. Switch penalties on.",
        });
      }
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const PlacementSchema = z.object({
  elementId: z.string().min(1),
  /**
   * The element's top-left where the learner left it, as fractions of the play
   * area.
   *
   * A position rather than a zone id, because nothing snaps: an element stays
   * exactly where it was dropped, and which zone that turns out to be inside
   * is worked out afterwards. Fractions rather than pixels so the same answer
   * grades the same on a phone and on a projector.
   */
  x: Fraction,
  y: Fraction,
});
export type Placement = z.infer<typeof PlacementSchema>;

export const AnswerSchema = z.object({
  /** Where the learner left each element. A clone appears more than once. */
  placements: z.array(PlacementSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Per-placement outcome, surfaced in `BitResult.detail.placements`. */
export type PlacementState = "correct" | "wrong";
