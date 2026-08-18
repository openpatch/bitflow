import {
  listBits,
  resolveLocale,
  translate,
  type BitflowDocument,
  type BitflowError,
  type BitFormProps,
  type Diagnostic,
  type ValidationResult,
} from "@bitflow/core";
import {
  BitView,
  CheckboxField,
  SecondsField,
  TextAreaField,
  TextField,
} from "@bitflow/element";
import {
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
  type Ref,
} from "react";
import { useStore } from "zustand";
import { ConditionEditor } from "./ConditionEditor";
import { createEditorStore, type EditorStore } from "./editorStore";
import { nodeTypes } from "./EditorNode";
import { summarise } from "./summarise";
import { Flow } from "./Flow";
import { messages } from "./messages";

export type FlowEditorHandle = {
  getFlow: () => BitflowDocument;
  validate: () => ValidationResult;
  save: () => BitflowDocument;
  undo: () => void;
  redo: () => void;
};

export type FlowEditorProps = {
  flow?: BitflowDocument | string;
  locale?: string;
  /** Inspect the flow without being able to change it. */
  readonly?: boolean;
  onEdit?: (flow: BitflowDocument) => void;
  onSave?: (flow: BitflowDocument) => void;
  onError?: (error: BitflowError) => void;
  ref?: Ref<FlowEditorHandle>;
};

/**
 * The teacher's editor: a canvas of steps on the left, the settings for
 * whatever is selected on the right, and a preview that runs the real learner
 * component rather than an approximation of it.
 */
export const FlowEditor = (props: FlowEditorProps): ReactElement => (
  // ReactFlow needs its provider above any component that uses its hooks, and
  // one per editor instance so two editors do not share a viewport.
  <ReactFlowProvider>
    <FlowEditorBody {...props} />
  </ReactFlowProvider>
);

const FlowEditorBody = ({
  flow,
  locale,
  readonly,
  onEdit,
  onSave,
  onError,
  ref,
}: FlowEditorProps): ReactElement => {
  const callbacks = useRef({ onEdit, onSave, onError });
  callbacks.current = { onEdit, onSave, onError };

  const store: EditorStore = useMemo(
    () =>
      createEditorStore({
        onEdit: (d) => callbacks.current.onEdit?.(d),
        onSave: (d) => callbacks.current.onSave?.(d),
        onError: (e) => callbacks.current.onError?.(e),
      }),
    [],
  );

  const state = useStore(store);
  const resolved = resolveLocale(locale);
  const [previewing, setPreviewing] = useState(false);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(messages, key, resolved, vars),
    [resolved],
  );

  useEffect(() => {
    if (flow !== undefined) store.getState().loadFlow(flow);
  }, [flow, store]);

  useImperativeHandle(
    ref,
    () => ({
      getFlow: () => store.getState().doc,
      validate: () => store.getState().validate(),
      save: () => store.getState().save(),
      undo: () => store.temporal.getState().undo(),
      redo: () => store.temporal.getState().redo(),
    }),
    [store],
  );

  const validation = useMemo(
    () => store.getState().validate(),
    // Recomputed whenever the document changes; validation is pure and cheap
    // enough to run on every edit, which is what makes the errors feel live.
    [store, state.doc],
  );

  const invalidNodeIds = useMemo(
    () => new Set(validation.diagnostics.map(nodeIdOf(state.doc)).filter(Boolean)),
    [validation, state.doc],
  );

  const nodes: Node[] = useMemo(
    () =>
      state.doc.nodes.map((node) => ({
        id: node.id,
        type: "bit",
        position: node.position,
        selected: node.id === state.selectedNodeId,
        data: {
          bitType: node.type,
          locale: resolved,
          invalid: invalidNodeIds.has(node.id),
          summary: summarise(node.data),
        },
      })),
    [state.doc.nodes, state.selectedNodeId, resolved, invalidNodeIds],
  );

  /**
   * React Flow's own copy of the nodes, which it is free to move.
   *
   * A drag is dozens of position changes a second. Sending each one to the
   * store would write the document — and add an undo step — per frame, so the
   * canvas keeps the in-progress position and the store hears once, on drop.
   * Without this the node did not move at all until it was released, because
   * `nodes` was controlled with nothing to write intermediate positions to.
   */
  const [canvasNodes, setCanvasNodes] = useState<Node[]>(nodes);

  /**
   * Whatever the document says wins: a new node, an undo, a reload.
   *
   * Merged rather than replaced, because React Flow hangs its own measurements
   * off each node and lays edges out from them. Swapping in fresh objects threw
   * those away, and the canvas then drew no edges at all.
   */
  useEffect(() => {
    setCanvasNodes((current) =>
      nodes.map((node) => {
        const existing = current.find((candidate) => candidate.id === node.id);
        return existing ? { ...existing, ...node } : node;
      }),
    );
  }, [nodes]);

  const edges: Edge[] = useMemo(
    () =>
      state.doc.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        selected: edge.id === state.selectedEdgeId,
        // A labelled edge is how an author sees at a glance which branch is
        // which without clicking each one.
        label: edge.label ?? (edge.condition ? "?" : undefined),
      })),
    [state.doc.edges, state.selectedEdgeId],
  );

  const selectedNode = state.doc.nodes.find((n) => n.id === state.selectedNodeId);
  const selectedEdge = state.doc.edges.find((e) => e.id === state.selectedEdgeId);

  return (
    <div
      className={
        previewing
          ? "bitflow-root bitflow-editor bitflow-editor-previewing"
          : "bitflow-root bitflow-editor"
      }
    >
      <div className="bitflow-editor-toolbar">
        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() => setPreviewing((on) => !on)}
        >
          {previewing ? t("stopPreview") : t("preview")}
        </button>

        {!readonly && (
          <>
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() => store.temporal.getState().undo()}
            >
              {t("undo")}
            </button>
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() => store.temporal.getState().redo()}
            >
              {t("redo")}
            </button>
            <button
              type="button"
              className="bitflow-button"
              onClick={() => store.getState().save()}
            >
              {t("save")}
            </button>
          </>
        )}

        <span
          className={
            validation.valid ? "bitflow-text-muted" : "bitflow-field-error"
          }
        >
          {validation.valid
            ? t("noProblems")
            : t("problems", { count: validation.diagnostics.length })}
        </span>
      </div>

      <div className="bitflow-editor-canvas">
        {previewing ? (
          <div className="bitflow-preview">
            <p className="bitflow-hint">{t("previewHint")}</p>
            {/* The real learner component, with persistence off: a preview
                must never be an approximation that can drift. */}
            <Flow flow={state.doc} locale={resolved} />
          </div>
        ) : (
          <ReactFlow
            nodes={canvasNodes}
            edges={edges}
            nodeTypes={nodeTypes as never}
            nodesDraggable={!readonly}
            nodesConnectable={!readonly}
            edgesReconnectable={!readonly}
            fitView
            // Presentation only: this is what lets a node follow the pointer.
            onNodesChange={(changes) =>
              setCanvasNodes((current) => applyNodeChanges(changes, current))
            }
            // The one place a move becomes an edit to the document.
            onNodeDragStop={(_event, node) =>
              store.getState().moveNode(node.id, node.position)
            }
            onNodeClick={(_event, node) =>
              store.getState().select({ nodeId: node.id, edgeId: null })
            }
            onEdgeClick={(_event, edge) =>
              store.getState().select({ edgeId: edge.id, nodeId: null })
            }
            onPaneClick={() =>
              store.getState().select({ nodeId: null, edgeId: null })
            }
            onConnect={(connection) => {
              if (!connection.source || !connection.target) return;
              store.getState().connect({
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle ?? undefined,
                targetHandle: connection.targetHandle ?? undefined,
              });
            }}
            onMoveEnd={(_event, viewport) =>
              store.getState().setViewport(viewport)
            }
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        )}
      </div>

      {/* Hidden while previewing: the palette and the settings are the
          author's tools, and a preview is meant to show what the learner sees
          — including how much room they get. */}
      {!previewing && (
      <aside className="bitflow-editor-sidebar">
        {!readonly && (
          <section className="bitflow-stack-small bitflow-stack">
            <h2 className="bitflow-heading">{t("palette")}</h2>
            <div className="bitflow-palette">
              {listBits().map((bit) => (
                <button
                  key={bit.type}
                  type="button"
                  className="bitflow-palette-item"
                  title={bit.info(resolved).description}
                  onClick={() => store.getState().addNode(bit.type)}
                >
                  {bit.info(resolved).name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="bitflow-stack">
          <h2 className="bitflow-heading">{t("inspector")}</h2>

          {selectedNode ? (
            <NodeInspector
              store={store}
              nodeId={selectedNode.id}
              readonly={readonly}
              locale={resolved}
              diagnostics={diagnosticsForNode(
                validation.diagnostics,
                state.doc,
                selectedNode.id,
              )}
            />
          ) : selectedEdge ? (
            <div className="bitflow-stack-small bitflow-stack">
              <ConditionEditor
                doc={state.doc}
                condition={selectedEdge.condition}
                locale={resolved}
                onChange={(condition) =>
                  store.getState().setEdgeCondition(selectedEdge.id, condition)
                }
              />
              {!readonly && (
                <button
                  type="button"
                  className="bitflow-button bitflow-button-secondary"
                  onClick={() => store.getState().removeEdge(selectedEdge.id)}
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <FlowSettings store={store} locale={resolved} readonly={readonly} t={t} />
          )}
        </section>

        {!validation.valid && (
          <section className="bitflow-stack-small bitflow-stack">
            <ul className="bitflow-problems">
              {validation.diagnostics.map((diagnostic, index) => (
                <li key={index} className="bitflow-field-error">
                  {diagnostic.message}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
      )}
    </div>
  );
};

const FlowSettings = ({
  store,
  locale,
  readonly,
  t,
}: {
  store: EditorStore;
  locale: ReturnType<typeof resolveLocale>;
  readonly?: boolean;
  t: (key: string) => string;
}) => {
  const doc = useStore(store, (s) => s.doc);
  if (readonly) {
    return <p className="bitflow-text-muted">{doc.meta.title}</p>;
  }

  return (
    <>
      <TextField
        label={t("flowTitle")}
        value={doc.meta.title}
        onChange={(title) => store.getState().updateMeta({ title })}
      />
      <TextAreaField
        label={t("flowDescription")}
        value={doc.meta.description ?? ""}
        rows={2}
        onChange={(description) => store.getState().updateMeta({ description })}
      />
      <SecondsField
        label={t("timeLimitLabel")}
        hint={t("timeLimitHint")}
        value={doc.meta.timeLimit}
        onChange={(timeLimit) => store.getState().updateMeta({ timeLimit })}
      />
      <CheckboxField
        label={t("askConfidence")}
        hint={t("askConfidenceHint")}
        checked={doc.meta.askConfidence}
        onChange={(askConfidence) => store.getState().updateMeta({ askConfidence })}
      />
      <CheckboxField
        label={t("askReasoning")}
        checked={doc.meta.askReasoning}
        onChange={(askReasoning) => store.getState().updateMeta({ askReasoning })}
      />
      <p className="bitflow-hint">{t("nothingSelected")}</p>
      <span className="bitflow-visually-hidden">{locale}</span>
    </>
  );
};

/**
 * The selected step's own settings, followed by a live preview of it.
 *
 * The preview renders through `BitView`, the same component the learner gets,
 * so "what the teacher sees while authoring" and "what the class sees" cannot
 * diverge.
 */
const NodeInspector = ({
  store,
  nodeId,
  readonly,
  locale,
  diagnostics,
}: {
  store: EditorStore;
  nodeId: string;
  readonly?: boolean;
  locale: ReturnType<typeof resolveLocale>;
  diagnostics: Diagnostic[];
}) => {
  const doc = useStore(store, (s) => s.doc);
  const node = doc.nodes.find((n) => n.id === nodeId);
  const t = (key: string) => translate(messages, key, locale);

  if (!node) return null;

  const bit = listBits().find((b) => b.type === node.type);
  const Form = bit?.Form as ComponentType<BitFormProps> | undefined;

  return (
    <div className="bitflow-stack">
      {Form && !readonly ? (
        <Form
          data={node.data}
          locale={locale}
          errors={diagnostics}
          onChange={(data) =>
            store.getState().updateNodeData(nodeId, data as Record<string, unknown>)
          }
        />
      ) : (
        <p className="bitflow-text-muted">{bit?.info(locale).description}</p>
      )}

      <div className="bitflow-inspector-preview">
        <BitView
          type={node.type}
          data={node.data}
          locale={locale}
          readonly
        />
      </div>

      {!readonly && (
        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() => store.getState().removeNode(nodeId)}
        >
          {t("deleteNode")}
        </button>
      )}
    </div>
  );
};

/** `nodes.3.data.choices` → the id of node 3. */
const nodeIdOf =
  (doc: BitflowDocument) =>
  (diagnostic: Diagnostic): string => {
    const match = /^nodes\.(\d+)/.exec(diagnostic.path);
    return match ? (doc.nodes[Number(match[1])]?.id ?? "") : "";
  };

/**
 * The diagnostics for one node, re-rooted at its `data` so a bit's form can
 * match them against its own field names.
 */
const diagnosticsForNode = (
  diagnostics: Diagnostic[],
  doc: BitflowDocument,
  nodeId: string,
): Diagnostic[] => {
  const index = doc.nodes.findIndex((n) => n.id === nodeId);
  if (index === -1) return [];
  const prefix = `nodes.${index}.data.`;
  return diagnostics
    .filter((d) => d.path.startsWith(prefix))
    .map((d) => ({ ...d, path: d.path.slice(prefix.length) }));
};
