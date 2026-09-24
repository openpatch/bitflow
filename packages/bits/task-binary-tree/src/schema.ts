import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";
import {
  compareKeys,
  findDuplicateKey,
  findMultiParented,
  isBst,
  isNumericMode,
  reachesEveryNode,
} from "./tree";

/**
 * A binary tree the learner walks: in a traversal order, as a binary search
 * that ends at a key or at "not found", or by inserting a list of keys one at
 * a time where a search tree puts them.
 *
 * All three are one bit because they share a diagram and a way of answering
 * it — tap places in order — and because the right answer is never authored
 * separately. It is computed here from the tree and the mode, the same way a
 * graph task computes a route's cost rather than storing one: an author who
 * edits a node label never has to remember to update an answer key that does
 * not exist.
 */

export const TreeNodeSchema = z.object({
  /** Stable across edits, so an answer keeps pointing at the same place. */
  id: z.string().min(1),
  /** The key shown in the node, and — in "search"/"insert" — the value a
   *  binary search compares against. */
  label: z.string().default(""),
  left: z.string().optional(),
  right: z.string().optional(),
});
export type TreeNode = z.infer<typeof TreeNodeSchema>;

export const TreeSchema = z.object({
  nodes: z.array(TreeNodeSchema).max(31).default([]),
  /** Omitted only when `nodes` is empty — "insert" is the only mode that
   *  starts with nothing to insert into. */
  root: z.string().optional(),
});
export type Tree = z.infer<typeof TreeSchema>;

export const MODES = ["traversal", "search", "insert"] as const;
export const ModeSchema = z.enum(MODES);
export type Mode = z.infer<typeof ModeSchema>;

export const TRAVERSAL_KINDS = ["preorder", "inorder", "postorder", "levelorder"] as const;
export const TraversalKindSchema = z.enum(TRAVERSAL_KINDS);
export type TraversalKind = z.infer<typeof TraversalKindSchema>;

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    mode: ModeSchema.default("traversal"),
    /** Only read in "traversal" mode. */
    traversal: TraversalKindSchema.default("inorder"),
    tree: TreeSchema.default({ nodes: [], root: undefined }),
    /** Only read in "search" mode. */
    searchKey: z.string().default(""),
    /** Only read in "insert" mode, inserted in this order. */
    insertKeys: z.array(z.string()).max(12).default([]),
    /**
     * A point per place named in the right order, or per key placed where it
     * belongs, rather than the whole task passing or failing as one. Off for
     * a task where reaching the end at all is the only thing worth a mark.
     */
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { tree, mode, searchKey, insertKeys } = ctx.value;
    const ids = tree.nodes.map((node) => node.id);
    const idSet = new Set(ids);

    const duplicateIds = new Set(ids).size !== ids.length;
    if (duplicateIds) {
      ctx.issues.push({
        code: "custom",
        input: tree.nodes,
        path: ["tree", "nodes"],
        message: "Each place needs its own id.",
      });
    }

    let dangling = false;
    tree.nodes.forEach((node, index) => {
      for (const side of ["left", "right"] as const) {
        const child = node[side];
        if (child !== undefined && !idSet.has(child)) {
          dangling = true;
          ctx.issues.push({
            code: "custom",
            input: node,
            path: ["tree", "nodes", index, side],
            message: "That child does not exist.",
          });
        }
      }
    });

    const multiParented = !duplicateIds && !dangling ? findMultiParented(tree.nodes) : undefined;
    if (multiParented) {
      ctx.issues.push({
        code: "custom",
        input: tree.nodes,
        path: ["tree", "nodes"],
        message: "One place is somebody's left child and somebody's right child (or the same child twice) — a tree never shares a child between two parents.",
      });
    }

    // Every check from here on assumes the shape above is sound, so a
    // dangling reference or a shared child does not also spill into a
    // confusing "root" or "not connected" message about the same mistake.
    let soundShape = !duplicateIds && !dangling && !multiParented;

    if (soundShape) {
      if (tree.nodes.length === 0) {
        if (tree.root !== undefined) {
          ctx.issues.push({
            code: "custom",
            input: tree.root,
            path: ["tree", "root"],
            message: "There is a root, but no places to be it.",
          });
          soundShape = false;
        }
      } else {
        const hasParent = new Set(
          tree.nodes.flatMap((node) => [node.left, node.right].filter((id): id is string => id !== undefined)),
        );
        const parentless = ids.filter((id) => !hasParent.has(id));
        if (parentless.length !== 1) {
          soundShape = false;
          ctx.issues.push({
            code: "custom",
            input: tree.nodes,
            path: ["tree", "nodes"],
            message:
              parentless.length === 0
                ? "Every place has a parent, so there is no root to start from."
                : "More than one place has no parent, so there is more than one tree here.",
          });
        } else if (tree.root !== parentless[0]) {
          soundShape = false;
          ctx.issues.push({
            code: "custom",
            input: tree.root,
            path: ["tree", "root"],
            message: "The root has to be the one place with no parent.",
          });
        }
      }
    }

    if (soundShape && !reachesEveryNode(tree.nodes, tree.root)) {
      ctx.issues.push({
        code: "custom",
        input: tree.nodes,
        path: ["tree", "nodes"],
        message: "Not every place hangs off the root — something is cut off, or the connections loop back on themselves.",
      });
      soundShape = false;
    }

    if (ctx.value.evaluation.mode !== "auto") return;

    if (mode === "traversal" && tree.nodes.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: tree.nodes,
        path: ["tree", "nodes"],
        message: "Add at least one place to give a traversal order for.",
      });
    }

    if (mode === "search") {
      if (tree.nodes.length === 0) {
        ctx.issues.push({
          code: "custom",
          input: tree.nodes,
          path: ["tree", "nodes"],
          message: "Add at least one place to search.",
        });
      }
      if (searchKey.trim() === "") {
        ctx.issues.push({
          code: "custom",
          input: searchKey,
          path: ["searchKey"],
          message: "Choose the key the learner is searching for.",
        });
      }
    }

    if (mode === "insert" && insertKeys.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: insertKeys,
        path: ["insertKeys"],
        message: "Add at least one key to insert.",
      });
    }

    if ((mode === "search" || mode === "insert") && soundShape && tree.root !== undefined) {
      const numeric = isNumericMode(ctx.value);
      if (!isBst(tree.nodes, tree.root, numeric)) {
        ctx.issues.push({
          code: "custom",
          input: tree.nodes,
          path: ["tree", "nodes"],
          message:
            "This has to be a binary search tree: everything to the left of a place is less than it, everything to the right is more.",
        });
      }
    }

    if (mode === "insert" && insertKeys.length > 0) {
      const numeric = isNumericMode(ctx.value);
      const repeated = findDuplicateKey(insertKeys, numeric);
      if (repeated !== undefined) {
        ctx.issues.push({
          code: "custom",
          input: insertKeys,
          path: ["insertKeys"],
          message: `"${repeated}" is listed to insert more than once.`,
        });
      } else {
        const clashing = insertKeys.find((key) =>
          tree.nodes.some((node) => compareKeys(node.label, key, numeric) === 0),
        );
        if (clashing !== undefined) {
          ctx.issues.push({
            code: "custom",
            input: insertKeys,
            path: ["insertKeys"],
            message: `"${clashing}" is already in the tree.`,
          });
        }
      }
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const PlacementSchema = z.object({
  key: z.string(),
  /** `null` only for a placement that starts an empty tree. */
  parent: z.string().nullable(),
  side: z.enum(["left", "right", "root"]),
});
export type Placement = z.infer<typeof PlacementSchema>;

export const AnswerSchema = z.object({
  /** "traversal"/"search": the places tapped, in order. */
  sequence: z.array(z.string()).default([]),
  /** "search" only: whether the learner also said the key was not there. */
  notFound: z.boolean().optional(),
  /** "insert" only: where each key in turn was tapped. */
  placements: z.array(PlacementSchema).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const nodeById = (tree: Tree, id: string): TreeNode | undefined =>
  tree.nodes.find((node) => node.id === id);

/** A place's key, or its id where the author has not given it one. */
export const nameOf = (tree: Tree, id: string): string => nodeById(tree, id)?.label || id;
