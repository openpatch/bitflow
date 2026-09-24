import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A scatter plot the learner classifies rather than reads: some points already
 * carry a class and are shown filled, some are centroids of a class, and the
 * rest are "open" — hollow, marked with a "?" — and the learner assigns each
 * one to a class. That covers both halves of the AI chapter's usual exercise
 * with one bit: predicting a query point's class by its nearest neighbours (no
 * centroids, every training point known), or assigning points to whichever
 * cluster centre they sit closest to (centroids present, no other known
 * points). Which one it is is never named in the data — it falls out of
 * whether the author added centroids, exactly as the two algorithms differ
 * only in what they measure distance to.
 */

export const SHAPES = ["circle", "square", "triangle", "diamond"] as const;
export const ShapeSchema = z.enum(SHAPES);
export type Shape = z.infer<typeof ShapeSchema>;

/**
 * A literal author colour rather than a fixed palette, unlike task-highlighting's
 * five hues: a class here stands for a real category the author names ("cat",
 * "spam"), and there can be more than five. Colour is never the only channel
 * that says which class a point is — `shape` is what survives for a reader who
 * cannot tell the colours apart, and the marker text carries the label too.
 */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export const ColorSchema = z
  .string()
  .regex(HEX_COLOR, "A colour is six hex digits after a #, like #017460.");

export const AxisSchema = z
  .object({
    label: z.string().default(""),
    min: z.number().default(0),
    max: z.number().default(10),
  })
  // `prefault` rather than `default`: the empty object is parsed, so the
  // fields' own defaults fill it in instead of it being taken as it stands.
  .prefault({});
export type Axis = z.infer<typeof AxisSchema>;

export const AxesSchema = z
  .object({
    x: AxisSchema,
    y: AxisSchema,
  })
  .prefault({});
export type Axes = z.infer<typeof AxesSchema>;

export const ClassSchema = z.object({
  /** Stable across edits, so a point and an answer keep pointing at the same class. */
  id: z.string().min(1),
  label: z.string().default(""),
  color: ColorSchema.default("#017460"),
  shape: ShapeSchema.default("circle"),
});
export type Class = z.infer<typeof ClassSchema>;

export const PointSchema = z.object({
  id: z.string().min(1),
  /** In axis units, never pixels — the plot is drawn at whatever size it is given. */
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
  /** Set on a known point: shown filled, in this class's shape and colour. */
  class: z.string().optional(),
  /**
   * Set on an open point: the class the learner is meant to find. Never shown
   * to the learner — it only exists for `evaluate` to compare the learner's
   * assignment against.
   */
  expected: z.string().optional(),
  /** A cluster centre. Drawn larger and apart from ordinary points; never open. */
  centroid: z.boolean().default(false),
});
export type Point = z.infer<typeof PointSchema>;

export type PointRole = "known" | "open" | "centroid";

/** What a point is, for anything that has to render or edit it differently. */
export const roleOf = (point: Point): PointRole =>
  point.centroid ? "centroid" : point.expected !== undefined ? "open" : "known";

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    axes: AxesSchema,
    classes: z.array(ClassSchema).default([]),
    points: z.array(PointSchema).default([]),
    showGrid: z.boolean().default(true),
    /**
     * A point per open point instead of one for the whole plot. On by default:
     * a learner who places nine of ten points correctly got nine right, the
     * same reasoning as task-code-trace's cell-by-cell credit.
     */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { axes, classes, points } = ctx.value;

    if (axes.x.max <= axes.x.min) {
      ctx.issues.push({
        code: "custom",
        input: axes.x,
        path: ["axes", "x", "max"],
        message: "The x‑axis needs a maximum greater than its minimum.",
      });
    }
    if (axes.y.max <= axes.y.min) {
      ctx.issues.push({
        code: "custom",
        input: axes.y,
        path: ["axes", "y", "max"],
        message: "The y‑axis needs a maximum greater than its minimum.",
      });
    }

    const classIds = classes.map((klass) => klass.id);
    if (new Set(classIds).size !== classIds.length) {
      ctx.issues.push({
        code: "custom",
        input: classes,
        path: ["classes"],
        message: "Each class needs its own id.",
      });
    }

    const pointIds = points.map((point) => point.id);
    if (new Set(pointIds).size !== pointIds.length) {
      ctx.issues.push({
        code: "custom",
        input: points,
        path: ["points"],
        message: "Each point needs its own id.",
      });
    }

    // Structural problems, worth catching whatever the grading mode: a point
    // referring to a class that does not exist, or sitting outside the axes it
    // is plotted on, cannot be drawn sensibly and so cannot be graded either.
    points.forEach((point, index) => {
      if (point.x < axes.x.min || point.x > axes.x.max) {
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "x"],
          message: `${point.x} is outside the x‑axis (${axes.x.min} to ${axes.x.max}).`,
        });
      }
      if (point.y < axes.y.min || point.y > axes.y.max) {
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "y"],
          message: `${point.y} is outside the y‑axis (${axes.y.min} to ${axes.y.max}).`,
        });
      }
      if (point.class !== undefined && !classIds.includes(point.class)) {
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "class"],
          message: "That class does not exist.",
        });
      }
      if (point.expected !== undefined && !classIds.includes(point.expected)) {
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "expected"],
          message: "That class does not exist.",
        });
      }
      if (point.expected !== undefined && point.class !== undefined) {
        // An open point is exactly the one whose class the learner has to
        // find. One that already carries a `class` is not open — it is a
        // known point wearing an answer key nobody can see, which is not
        // something a form can tell apart from a mistake.
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "class"],
          message: "An open point cannot also carry a known class. Clear one of the two.",
        });
      }
      if (point.centroid && point.class === undefined) {
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "class"],
          message: "A centroid needs the class it is the centre of.",
        });
      }
      if (point.centroid && point.expected !== undefined) {
        ctx.issues.push({
          code: "custom",
          input: point,
          path: ["points", index, "expected"],
          message: "A centroid is never open.",
        });
      }
    });

    if (ctx.value.evaluation.mode !== "auto") return;

    if (classes.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: classes,
        path: ["classes"],
        message: "Add at least one class.",
      });
    }

    classes.forEach((klass, index) => {
      if (klass.label.trim() === "") {
        ctx.issues.push({
          code: "custom",
          input: klass,
          path: ["classes", index, "label"],
          message: "Give the class a name.",
        });
      }
    });

    const openPoints = points.filter((point) => point.expected !== undefined);
    if (openPoints.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: points,
        path: ["points"],
        message: "Add at least one open point for the learner to classify.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Open point id → the class the learner assigned it. */
  assignments: z.record(z.string(), z.string()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const classById = (data: Data, id: string | undefined): Class | undefined =>
  id === undefined ? undefined : data.classes.find((klass) => klass.id === id);

/** A class's name, or its id where the author has not given it one. */
export const classLabel = (data: Data, id: string | undefined): string =>
  classById(data, id)?.label || id || "";

export const openPoints = (data: Data): Point[] =>
  data.points.filter((point) => point.expected !== undefined);

export const centroids = (data: Data): Point[] =>
  data.points.filter((point) => point.centroid);

/** Every point that already carries a class the learner can measure against. */
export const knownPoints = (data: Data): Point[] =>
  data.points.filter((point) => !point.centroid && point.class !== undefined);
