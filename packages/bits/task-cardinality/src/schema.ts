import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A diagram of entities and the relationships between them, whose relationship
 * ends the learner labels with cardinalities — the step of data modelling a
 * school book asks about most: "a pupil borrows many books, a book is borrowed
 * by at most one pupil at a time".
 *
 * The entities and relationships are drawn by the author; only the numbers at
 * the ends are the learner's. That keeps it a question about reading a
 * situation, not about drawing a diagram — which, on a phone, nobody could do
 * anyway.
 *
 * What a label at an end *means* — whether it is read "across" the line or
 * "here", as notations disagree — is the author's to teach. The bit only asks
 * which label belongs at which end.
 */

/** The labels each notation offers at an end, in the order they are offered. */
export const NOTATIONS = {
  /** Chen: 1, and n or m for "many". */
  chen: ["1", "n", "m"],
  /** Min-max pairs. */
  minmax: ["(0,1)", "(1,1)", "(0,*)", "(1,*)"],
  /** UML multiplicities, as class diagrams write them. */
  uml: ["0..1", "1", "*", "1..*"],
} as const;
export type Notation = keyof typeof NOTATIONS;
export const NotationSchema = z.enum(["chen", "minmax", "uml"]);

export const labelsOf = (notation: Notation): readonly string[] => NOTATIONS[notation];

export const EntitySchema = z.object({
  /** Stable across edits, so a relationship keeps pointing at the same box. */
  id: z.string().min(1),
  name: z.string().default(""),
  /** Where the box's middle sits, as fractions of the diagram (0–1). */
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
});
export type Entity = z.infer<typeof EntitySchema>;

export const RelationshipSchema = z.object({
  id: z.string().min(1),
  /** The verb on the line or in the diamond: "borrows", "teaches". */
  name: z.string().default(""),
  from: z.string(),
  to: z.string(),
  /** The label that belongs at the `from` end, next to that entity. */
  expectedFrom: z.string().default(""),
  /** The label that belongs at the `to` end. */
  expectedTo: z.string().default(""),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    notation: NotationSchema.default("chen"),
    entities: z.array(EntitySchema).default([]),
    relationships: z.array(RelationshipSchema).default([]),
    /** A point per end rather than one for the whole diagram. */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { entities, relationships, notation, evaluation } = ctx.value;
    const entityIds = entities.map((entity) => entity.id);

    if (new Set(entityIds).size !== entityIds.length) {
      ctx.issues.push({
        code: "custom",
        input: entities,
        path: ["entities"],
        message: "Each entity needs its own id.",
      });
    }
    const relationshipIds = relationships.map((relationship) => relationship.id);
    if (new Set(relationshipIds).size !== relationshipIds.length) {
      ctx.issues.push({
        code: "custom",
        input: relationships,
        path: ["relationships"],
        message: "Each relationship needs its own id.",
      });
    }

    relationships.forEach((relationship, index) => {
      for (const end of ["from", "to"] as const) {
        if (!entityIds.includes(relationship[end])) {
          ctx.issues.push({
            code: "custom",
            input: relationship,
            path: ["relationships", index, end],
            message: "Choose an entity for each end.",
          });
        }
      }
      if (relationship.from === relationship.to) {
        ctx.issues.push({
          code: "custom",
          input: relationship,
          path: ["relationships", index, "to"],
          message: "A relationship here joins two different entities.",
        });
      }
    });

    if (evaluation.mode !== "auto") return;

    if (relationships.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: relationships,
        path: ["relationships"],
        message: "Add at least one relationship to label.",
      });
    }

    const labels = labelsOf(notation);
    relationships.forEach((relationship, index) => {
      for (const end of ["expectedFrom", "expectedTo"] as const) {
        if (!labels.includes(relationship[end])) {
          ctx.issues.push({
            code: "custom",
            input: relationship,
            path: ["relationships", index, end],
            message: `Choose the answer for this end: one of ${labels.join(", ")}.`,
          });
        }
      }
    });
  });

export type Data = z.infer<typeof DataSchema>;

export type End = "from" | "to";

/** Where one end's answer is kept: `<relationshipId>:<from|to>`. */
export const endKey = (relationshipId: string, end: End): string => `${relationshipId}:${end}`;

export const AnswerSchema = z.object({
  ends: z.record(z.string(), z.string()).default({}),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const entityById = (data: Data, id: string): Entity | undefined =>
  data.entities.find((entity) => entity.id === id);
