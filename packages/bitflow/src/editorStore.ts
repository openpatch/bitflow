import {
  createId,
  getBit,
  parseFlow,
  validateFlow,
  type BitEdge,
  type BitflowDocument,
  type BitflowError,
  type BitNode,
  type Condition,
  type Position,
  type ValidationResult,
  type Viewport,
} from "@bitflow/core";
import { temporal, type TemporalState } from "zundo";
import { layout } from "./layout";
import { createStore, type StoreApi } from "zustand";

export type EditorCallbacks = {
  /** Every material change to the document. */
  onEdit?: (doc: BitflowDocument) => void;
  onSave?: (doc: BitflowDocument) => void;
  onError?: (error: BitflowError) => void;
};

export type EditorState = {
  doc: BitflowDocument;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  loadFlow: (input: unknown) => void;
  updateMeta: (meta: Partial<BitflowDocument["meta"]>) => void;
  addNode: (type: string, position?: Position) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  moveNode: (id: string, position: Position) => void;
  /** Repositions every step on a grid. One undo step, not one per node. */
  arrange: () => void;
  removeNode: (id: string) => void;
  connect: (edge: Omit<BitEdge, "id">) => void;
  setEdgeCondition: (id: string, condition: Condition | undefined) => void;
  removeEdge: (id: string) => void;
  setViewport: (viewport: Viewport) => void;
  select: (selection: { nodeId?: string | null; edgeId?: string | null }) => void;
  save: () => BitflowDocument;
  validate: () => ValidationResult;
};

export const emptyDocument = (): BitflowDocument => ({
  version: 1,
  meta: {
    id: createId("flow"),
    title: "",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
  },
  nodes: [],
  edges: [],
});

export type EditorStore = StoreApi<EditorState> & {
  temporal: StoreApi<TemporalState<{ doc: BitflowDocument }>>;
};

export const createEditorStore = (
  callbacks: EditorCallbacks = {},
): EditorStore =>
  createStore<EditorState>()(
    temporal(
      (set, get) => {
        /**
         * The single place an authoring change is published, mirroring the
         * learner store's `commit`. Selection and viewport changes go around
         * it: moving the camera is not an edit, and a host that writes the
         * document to disk on every edit must not be woken by a pan.
         */
        const edit = (doc: BitflowDocument) => {
          set({ doc });
          callbacks.onEdit?.(doc);
        };

        return {
          doc: emptyDocument(),
          selectedNodeId: null,
          selectedEdgeId: null,

          loadFlow: (input) => {
            const parsed = parseFlow(input);
            if (!parsed.ok) {
              callbacks.onError?.(parsed.error);
              return;
            }
            // Loading is not an edit: it must not echo back to the host that
            // just handed us the document, or an editor and a file watcher
            // would write to each other forever.
            set({
              doc: parsed.value,
              selectedNodeId: null,
              selectedEdgeId: null,
            });
          },

          updateMeta: (meta) => {
            const { doc } = get();
            edit({ ...doc, meta: { ...doc.meta, ...meta } });
          },

          addNode: (type, position) => {
            const { doc } = get();
            const bit = getBit(type);
            if (!bit) {
              callbacks.onError?.({
                code: "UNKNOWN_BIT_TYPE",
                message: `No bit is registered for type "${type}".`,
              });
              return;
            }

            const node: BitNode = {
              id: createId(type),
              type,
              position: position ?? nextFreePosition(doc.nodes),
              data: bit.defaultData() as Record<string, unknown>,
            };

            // Chaining the new step onto something keeps the graph connected,
            // which is what validation asks for and what an author almost
            // always wants next. The selected step comes first — that is where
            // their attention is — then the last step that can still lead
            // somewhere. An `end` bit is terminal, so it never chains.
            const previous = chainSource(doc.nodes, get().selectedNodeId);

            edit({
              ...doc,
              nodes: [...doc.nodes, node],
              edges: previous
                ? [
                    ...doc.edges,
                    {
                      id: createId("edge"),
                      source: previous.id,
                      target: node.id,
                    },
                  ]
                : doc.edges,
            });
            set({ selectedNodeId: node.id, selectedEdgeId: null });
          },

          updateNodeData: (id, data) => {
            const { doc } = get();
            edit({
              ...doc,
              nodes: doc.nodes.map((node) =>
                node.id === id ? { ...node, data } : node,
              ),
            });
          },

          arrange: () => {
            edit(layout(get().doc));
          },

          moveNode: (id, position) => {
            const { doc } = get();
            edit({
              ...doc,
              nodes: doc.nodes.map((node) =>
                node.id === id ? { ...node, position } : node,
              ),
            });
          },

          removeNode: (id) => {
            const { doc } = get();
            edit({
              ...doc,
              nodes: doc.nodes.filter((node) => node.id !== id),
              // Edges to a deleted node would fail validation and are never
              // what the author meant to keep.
              edges: doc.edges.filter(
                (e) => e.source !== id && e.target !== id,
              ),
            });
            set({ selectedNodeId: null });
          },

          connect: (edge) => {
            const { doc } = get();
            const exists = doc.edges.some(
              (e) =>
                e.source === edge.source &&
                e.target === edge.target &&
                e.sourceHandle === edge.sourceHandle,
            );
            if (exists) return;
            edit({
              ...doc,
              edges: [...doc.edges, { ...edge, id: createId("edge") }],
            });
          },

          setEdgeCondition: (id, condition) => {
            const { doc } = get();
            edit({
              ...doc,
              edges: doc.edges.map((e) =>
                e.id === id
                  ? condition
                    ? { ...e, condition }
                    : stripCondition(e)
                  : e,
              ),
            });
          },

          removeEdge: (id) => {
            const { doc } = get();
            edit({ ...doc, edges: doc.edges.filter((e) => e.id !== id) });
            set({ selectedEdgeId: null });
          },

          // Camera only: not an edit, not an undo step.
          setViewport: (viewport) => set({ doc: { ...get().doc, viewport } }),

          select: ({ nodeId, edgeId }) =>
            set({
              selectedNodeId: nodeId === undefined ? get().selectedNodeId : nodeId,
              selectedEdgeId: edgeId === undefined ? get().selectedEdgeId : edgeId,
            }),

          save: () => {
            const { doc } = get();
            callbacks.onSave?.(doc);
            return doc;
          },

          validate: () => validateFlow(get().doc),
        };
      },
      {
        // Only the document is undoable. Undo that also moved the selection or
        // the camera feels like it undid more than the author did.
        partialize: (state) => ({ doc: state.doc }),
        limit: 100,
        equality: (a, b) => a.doc === b.doc,
      },
    ),
  ) as EditorStore;

const stripCondition = (edge: BitEdge): BitEdge => {
  const { condition: _condition, ...rest } = edge;
  return rest;
};

/** The step a newly added one should be connected after, if any. */
const chainSource = (
  nodes: BitNode[],
  selectedNodeId: string | null,
): BitNode | undefined => {
  const canChain = (node: BitNode) => getBit(node.type)?.kind !== "end";

  const selected = nodes.find((n) => n.id === selectedNodeId);
  if (selected && canChain(selected)) return selected;

  return [...nodes].reverse().find(canChain);
};

/** Drops a new node below the lowest one so it never lands on top of another. */
const nextFreePosition = (nodes: BitNode[]): Position => {
  if (nodes.length === 0) return { x: 0, y: 0 };
  const lowest = nodes.reduce((a, b) => (a.position.y > b.position.y ? a : b));
  return { x: lowest.position.x, y: lowest.position.y + 120 };
};
