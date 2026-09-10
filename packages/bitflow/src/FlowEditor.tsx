import {
  attemptAt,
  listBits,
  resolveLocale,
  translate,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitflowError,
  type BitFormProps,
  type BitNode,
  type Diagnostic,
  type ValidationResult,
} from "@bitflow/core";
import {
  BitView,
  CheckboxField,
  Disclosure,
  Field,
  SecondsField,
  SelectField,
  TextAreaField,
  TextField,
  usePanels,
  type Panels,
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
  Component,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useStore } from "zustand";
import { ConditionEditor, summariseCondition } from "./ConditionEditor";
import { createEditorStore, type EditorStore } from "./editorStore";
import { nodeTypes } from "./EditorNode";
import { summarise } from "./summarise";
import { Flow } from "./Flow";
import { editorMessages as messages } from "./editorMessages";
import {
  DEFAULT_INSPECTOR,
  InspectorResizer,
} from "./InspectorResizer";

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
  /**
   * The step the running preview started at, captured when it starts.
   * Selecting something else while it runs must not yank the learner back —
   * the preview is a run, not a mirror of the canvas.
   */
  const [previewFrom, setPreviewFrom] = useState<string | null>(null);
  /**
   * How wide the inspector is, in pixels.
   *
   * Held here rather than in the document: it is what this person needs while
   * looking at this screen, not part of the assessment, and saving it into the
   * file would push a preference at everyone the file is sent to.
   */
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_INSPECTOR);
  // The palette starts open — a new flow has nothing on the canvas and the
  // palette is the only way to begin. The settings groups start closed.
  const palettePanel = useGroups(["palette"]);
  const settingsPanels = useGroups();
  const editorRef = useRef<HTMLDivElement>(null);

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
        // which without clicking each one. Failing a name they wrote, the rule
        // describes itself: this used to draw a bare "?" on every conditional
        // edge, so a step with four branches out of it showed four identical
        // question marks and the only way to tell them apart was to click each.
        label:
          edge.label ||
          summariseCondition(state.doc, edge.condition, resolved) ||
          undefined,
      })),
    [state.doc.edges, state.selectedEdgeId, state.doc.meta.sections, resolved],
  );

  const selectedNode = state.doc.nodes.find((n) => n.id === state.selectedNodeId);
  const selectedEdge = state.doc.edges.find((e) => e.id === state.selectedEdgeId);

  return (
    <div
      ref={editorRef}
      className={
        previewing
          ? "bitflow-root bitflow-editor bitflow-editor-previewing"
          : "bitflow-root bitflow-editor"
      }
      style={
        { "--bitflow-inspector-width": `${inspectorWidth}px` } as CSSProperties
      }
    >
      <div className="bitflow-editor-toolbar">
        <button
          type="button"
          className="bitflow-button bitflow-button-secondary"
          onClick={() => {
            // Starting from the selected step, when there is one: reaching the
            // last task of a twenty-step flow by answering the nineteen before
            // it is not a reasonable thing to ask of its author.
            setPreviewFrom(previewing ? null : state.selectedNodeId);
            setPreviewing((on) => !on);
          }}
        >
          {previewing
            ? t("stopPreview")
            : state.selectedNodeId
              ? t("previewFromHere")
              : t("preview")}
        </button>

        {!readonly && (
          <>
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() => store.getState().arrange()}
            >
              {t("arrange")}
            </button>
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
            <p className="bitflow-hint">
              {previewFrom ? t("previewFromHereHint") : t("previewHint")}
            </p>
            {/* The real learner component, with persistence off: a preview
                must never be an approximation that can drift. */}
            <Flow
              flow={state.doc}
              attempt={startedAt(state.doc, previewFrom)}
              locale={resolved}
            />
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
        <InspectorResizer
          width={inspectorWidth}
          editorWidth={editorRef.current?.clientWidth ?? 0}
          locale={resolved}
          onResize={setInspectorWidth}
        />
      )}

      {!previewing && (
      <aside className="bitflow-editor-sidebar">
        {!readonly && (
          <section className="bitflow-stack-small bitflow-stack">
            {/* Folds, because it is thirty buttons and it sits above the
                thing being edited: an author who is editing rather than
                building scrolled past all of them on every step. Open to
                begin with, and it stays wherever they leave it. */}
            <Disclosure
              summary={t("palette")}
              aside={t("groupPalette", { count: listBits().length })}
              {...palettePanel.props("palette")}
            >
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
            </Disclosure>
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
                <TextField
                  label={t("edgeLabel")}
                  hint={t("edgeLabelHint")}
                  value={selectedEdge.label ?? ""}
                  onChange={(label) =>
                    store.getState().setEdgeLabel(selectedEdge.id, label)
                  }
                />
              )}
              {!readonly && (
                <SelectField
                  label={t("edgeReset")}
                  hint={t("edgeResetHint")}
                  value={selectedEdge.resetTarget ?? ""}
                  options={[
                    { value: "", label: t("edgeResetNone") },
                    { value: "result", label: t("edgeResetResult") },
                    { value: "answer", label: t("edgeResetAnswer") },
                  ]}
                  onChange={(reset) =>
                    store
                      .getState()
                      .setEdgeReset(
                        selectedEdge.id,
                        reset === "" ? undefined : (reset as "result" | "answer"),
                      )
                  }
                />
              )}
              {!readonly && (
                <button
                  type="button"
                  className="bitflow-button bitflow-button-secondary"
                  onClick={() => store.getState().removeEdge(selectedEdge.id)}
                >
                  {t("deleteEdge")}
                </button>
              )}
            </div>
          ) : (
            <FlowSettings
              store={store}
              locale={resolved}
              readonly={readonly}
              panels={settingsPanels}
              t={t}
            />
          )}
        </section>

        {!validation.valid && (
          <section className="bitflow-stack-small bitflow-stack">
            <ul className="bitflow-problems">
              {validation.diagnostics.map((diagnostic, index) => {
                const target = targetOf(state.doc)(diagnostic);
                return (
                  <li key={index} className="bitflow-field-error">
                    {/* Every diagnostic carries the exact path to what is
                        wrong. Reading it out and making the reader find the
                        step themselves wastes what validation already knows. */}
                    {target ? (
                      <button
                        type="button"
                        className="bitflow-problem-link"
                        onClick={() => {
                          if (target.kind === "node") {
                            store
                              .getState()
                              .select({ nodeId: target.nodeId, edgeId: null });
                            return;
                          }
                          if (target.kind === "edge") {
                            store
                              .getState()
                              .select({ nodeId: null, edgeId: target.edgeId });
                            return;
                          }
                          // The flow's own settings: clear the selection so the
                          // panel shows them, and open the group at fault —
                          // otherwise the author is sent to a folded heading.
                          store
                            .getState()
                            .select({ nodeId: null, edgeId: null });
                          settingsPanels.open(target.group);
                        }}
                      >
                        {diagnostic.message}
                      </button>
                    ) : (
                      diagnostic.message
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </aside>
      )}
    </div>
  );
};

/**
 * The flow's own settings, in groups that fold away.
 *
 * They used to be one flat column — every field, every explanation, all of it
 * on screen at once — which came to about two pages of prose in a panel three
 * hundred pixels wide. None of the text was wrong; there was just no way to put
 * it down.
 *
 * So each group collapses, and its summary carries what it is currently set
 * to. That is the part that makes folding safe: an author can read every
 * setting off the closed panel and only open the one they mean to change.
 */
/**
 * Open/closed state for the sidebar's groups, remembered for the session.
 *
 * Not `usePanels`, which opens whichever rows *appear* — right for a list an
 * author is adding to, wrong for a fixed set of groups that all exist from the
 * start. Held here rather than inside each group so that selecting a step and
 * coming back does not refold everything the author had opened.
 */
const useGroups = (openAtFirst: string[] = []): Panels => {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(openAtFirst.map((id) => [id, true])),
  );
  const set = (id: string, next: boolean) =>
    setOpen((current) => ({ ...current, [id]: next }));

  return {
    props: (id) => ({
      open: open[id] ?? false,
      onOpenChange: (next) => set(id, next),
    }),
    open: (id) => set(id, true),
  };
};

const FlowSettings = ({
  store,
  locale,
  readonly,
  panels,
  t,
}: {
  store: EditorStore;
  locale: ReturnType<typeof resolveLocale>;
  readonly?: boolean;
  /** Held above this component so a trip to a step and back does not refold. */
  panels: Panels;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) => {
  const doc = useStore(store, (s) => s.doc);
  if (readonly) {
    return <p className="bitflow-text-muted">{doc.meta.title}</p>;
  }

  const { meta } = doc;
  const asking = [
    meta.askConfidence ? t("askConfidenceShort") : "",
    meta.askReasoning ? t("askReasoningShort") : "",
  ].filter(Boolean);

  // The short form, not the one in the dropdown: the dropdown explains the
  // choice in a sentence, the folded summary is a value and has one line.
  const navigationLabel = {
    linear: t("navigationShortLinear"),
    back: t("navigationShortBack"),
    free: t("navigationShortFree"),
  }[meta.navigation];

  /** `translate` has no plurals, so a count says which wording it wants. */
  const counted = (count: number, one: string, many: string) =>
    count === 1 ? t(one) : t(many, { count });

  return (
    <>
      {/* The two an author looks at first, and the only two worth the room
          unconditionally. */}
      <TextField
        label={t("flowTitle")}
        value={meta.title}
        onChange={(title) => store.getState().updateMeta({ title })}
      />
      <TextAreaField
        label={t("flowDescription")}
        value={meta.description ?? ""}
        rows={2}
        onChange={(description) => store.getState().updateMeta({ description })}
      />

      <Disclosure
        summary={t("groupTiming")}
        aside={
          meta.timeLimit
            ? t("groupTimingSet", { minutes: Math.ceil(meta.timeLimit / 60) })
            : t("groupTimingNone")
        }
        {...panels.props("timing")}
      >
        <SecondsField
          label={t("timeLimitLabel")}
          hint={t("timeLimitHint")}
          value={meta.timeLimit}
          onChange={(timeLimit) => store.getState().updateMeta({ timeLimit })}
        />
      </Disclosure>

      <Disclosure
        summary={t("groupMoving")}
        aside={navigationLabel}
        {...panels.props("moving")}
      >
        <SelectField
          label={t("navigation")}
          hint={t("navigationHint")}
          value={meta.navigation}
          options={[
            { value: "linear", label: t("navigationLinear") },
            { value: "back", label: t("navigationBack") },
            { value: "free", label: t("navigationFree") },
          ]}
          onChange={(navigation) => store.getState().updateMeta({ navigation })}
        />
        <CheckboxField
          label={t("allowSkip")}
          hint={t("allowSkipHint")}
          checked={meta.allowSkip}
          onChange={(allowSkip) => store.getState().updateMeta({ allowSkip })}
        />
      </Disclosure>

      <Disclosure
        summary={t("groupAsking")}
        aside={asking.length > 0 ? asking.join(" · ") : t("groupAskingNone")}
        {...panels.props("asking")}
      >
        <CheckboxField
          label={t("askConfidence")}
          hint={t("askConfidenceHint")}
          checked={meta.askConfidence}
          onChange={(askConfidence) =>
            store.getState().updateMeta({ askConfidence })
          }
        />
        <CheckboxField
          label={t("askReasoning")}
          checked={meta.askReasoning}
          onChange={(askReasoning) =>
            store.getState().updateMeta({ askReasoning })
          }
        />
      </Disclosure>

      <Disclosure
        summary={t("pools")}
        aside={
          meta.pools.length > 0
            ? counted(meta.pools.length, "groupPoolsOne", "groupPoolsMany")
            : t("groupNone")
        }
        {...panels.props("pools")}
      >
        <Pools store={store} doc={doc} t={t} />
      </Disclosure>

      <Disclosure
        summary={t("sections")}
        aside={
          meta.sections.length > 0
            ? counted(
                meta.sections.length,
                "groupSectionsOne",
                "groupSectionsMany",
              )
            : t("groupNone")
        }
        {...panels.props("sections")}
      >
        <Sections store={store} doc={doc} t={t} />
      </Disclosure>

      <p className="bitflow-hint">{t("nothingSelected")}</p>
      <span className="bitflow-visually-hidden">{locale}</span>
    </>
  );
};

/**
 * Declaring the pools, and how many steps each hands out.
 *
 * Which steps are *in* a pool is set on the steps themselves, not listed here:
 * a pool holding a list of node ids goes stale the moment one is deleted, and
 * the author is looking at the step anyway when they decide it is one of a
 * set.
 */
const Pools = ({
  store,
  doc,
  t,
}: {
  store: EditorStore;
  doc: BitflowDocument;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) => {
  const pools = doc.meta.pools;

  const update = (id: string, patch: Partial<(typeof pools)[number]>) =>
    store.getState().updateMeta({
      pools: pools.map((pool) => (pool.id === id ? { ...pool, ...patch } : pool)),
    });

  return (
    <section className="bitflow-stack-small bitflow-stack">
      <p className="bitflow-hint">{t("poolsHint")}</p>

      {pools.map((pool) => {
        const members = doc.nodes.filter((node) => node.pool === pool.id).length;
        return (
          <div key={pool.id} className="bitflow-rule">
            <TextField
              label={t("poolLabel")}
              value={pool.label}
              onChange={(label) => update(pool.id, { label })}
            />
            <Field
              label={t("poolDraw")}
              // Says what it will actually do, so "5 of 3" is visible without
              // reading the problems list.
              hint={t("poolDrawHint", { members })}
            >
              {(props) => (
                <input
                  {...props}
                  type="number"
                  className="bitflow-input"
                  min={1}
                  value={pool.draw}
                  onChange={(event) =>
                    update(pool.id, {
                      draw: Math.max(1, Math.round(Number(event.target.value) || 1)),
                    })
                  }
                />
              )}
            </Field>
            <CheckboxField
              label={t("poolShuffle")}
              hint={t("poolShuffleHint")}
              checked={pool.shuffle}
              onChange={(shuffle) => update(pool.id, { shuffle })}
            />
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() =>
                store.getState().updateMeta({
                  pools: pools.filter((other) => other.id !== pool.id),
                })
              }
            >
              {t("removePool")}
            </button>
          </div>
        );
      })}

      <button
        type="button"
        className="bitflow-button bitflow-button-secondary"
        onClick={() =>
          store.getState().updateMeta({
            pools: [
              ...pools,
              {
                id: `pool-${pools.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
                label: t("poolDefaultLabel", { number: pools.length + 1 }),
                draw: 1,
                shuffle: false,
              },
            ],
          })
        }
      >
        {t("addPool")}
      </button>
    </section>
  );
};

/**
 * Declaring the sections, and the material every step in one is about.
 *
 * Which steps are *in* a section is set on the steps themselves, for the same
 * reason pool membership is: a list of node ids here would go stale the moment
 * one was deleted, and the author is looking at the step when they decide it
 * belongs with the others.
 *
 * A panel per section rather than a compact line, because the passage is a
 * whole textarea and the rows would not fit on one.
 */
const Sections = ({
  store,
  doc,
  t,
}: {
  store: EditorStore;
  doc: BitflowDocument;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) => {
  const sections = doc.meta.sections;
  const panels = usePanels(sections.map((section) => section.id));

  const update = (id: string, patch: Partial<(typeof sections)[number]>) =>
    store.getState().updateMeta({
      sections: sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    });

  return (
    <section className="bitflow-stack-small bitflow-stack">
      <p className="bitflow-hint">{t("sectionsHint")}</p>

      {sections.map((section) => {
        const members = doc.nodes.filter(
          (node) => node.section === section.id,
        ).length;
        return (
          <Disclosure
            key={section.id}
            summary={section.label || t("sectionUnnamed")}
            // `usePanels` opens the rows that appear, so "Add a section" hands
            // back the textarea rather than a shut row called "Section 2".
            {...panels.props(section.id)}
          >
            <TextField
              label={t("sectionLabel")}
              hint={t("sectionLabelHint")}
              value={section.label}
              onChange={(label) => update(section.id, { label })}
            />
            <TextAreaField
              label={t("sectionMarkdown")}
              // Says how many steps will show it, so an empty section is
              // visible here rather than only in the problems list.
              hint={t("sectionMarkdownHint", { members })}
              rows={4}
              value={section.markdown}
              onChange={(markdown) => update(section.id, { markdown })}
            />
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() =>
                store.getState().updateMeta({
                  sections: sections.filter(
                    (other) => other.id !== section.id,
                  ),
                })
              }
            >
              {t("removeSection")}
            </button>
          </Disclosure>
        );
      })}

      <button
        type="button"
        className="bitflow-button bitflow-button-secondary"
        onClick={() =>
          store.getState().updateMeta({
            sections: [
              ...sections,
              {
                id: `section-${sections.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
                label: t("sectionDefaultLabel", { number: sections.length + 1 }),
                markdown: "",
              },
            ],
          })
        }
      >
        {t("addSection")}
      </button>
    </section>
  );
};

/**
 * Keeps one broken authoring form from taking the editor with it.
 *
 * `BitView` already refuses to render a task whose data does not match its
 * schema — "a document can outlive the schema it was authored against". The
 * authoring side needs the same promise and it matters more: a learner who
 * meets a bad step loses that step, an author who meets one loses the canvas,
 * the palette, and whatever they had not saved.
 *
 * So the form is given a way to fail that leaves the rest standing, and the
 * author is offered the one repair that is always available — start this step
 * over. It goes through `updateNodeData`, so it is an ordinary edit and undo
 * brings the old data back.
 */
class FormBoundary extends Component<
  {
    locale: ReturnType<typeof resolveLocale>;
    /** The bit's own name, so the message says which step is at fault. */
    name: string;
    onReset: () => void;
    children: ReactNode;
  },
  { error: Error | undefined }
> {
  state: { error: Error | undefined } = { error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const t = (key: string, vars?: Record<string, string | number>) =>
      translate(messages, key, this.props.locale, vars);

    return (
      <div className="bitflow-alert bitflow-alert-error" role="alert">
        <div className="bitflow-stack-small bitflow-stack">
          <strong>{t("formBroken", { name: this.props.name })}</strong>
          <p className="bitflow-text-muted">{t("formBrokenHint")}</p>
          <p className="bitflow-text-muted">{error.message}</p>
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => {
              this.props.onReset();
              this.setState({ error: undefined });
            }}
          >
            {t("formBrokenReset")}
          </button>
        </div>
      </div>
    );
  }
}

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
      {Form && bit && !readonly ? (
        <FormBoundary
          key={nodeId}
          locale={locale}
          name={bit.info(locale).name}
          onReset={() =>
            store
              .getState()
              .updateNodeData(nodeId, bit.defaultData() as Record<string, unknown>)
          }
        >
          <Form
            // Merged over the bit's defaults rather than passed straight
            // through. `parseFlow` deliberately does not check bit data, so a
            // document written against an older version of a bit arrives here
            // with fields the form expects simply absent — and a form reading
            // `data.choices.map` on `undefined` takes the whole editor down.
            // The merge fills those in; the first edit then writes the
            // completed shape back and the document is current again.
            data={{ ...(bit.defaultData() as object), ...node.data }}
            locale={locale}
            errors={diagnostics}
            onChange={(data) =>
              store.getState().updateNodeData(nodeId, data as Record<string, unknown>)
            }
          />
        </FormBoundary>
      ) : (
        <p className="bitflow-text-muted">{bit?.info(locale).description}</p>
      )}

      {/* Folded, and named by what the step already belongs to. Both pickers
          sat open under every step's own form with a line of explanation each,
          for a setting most steps never use. */}
      {!readonly && (doc.meta.pools.length > 0 || doc.meta.sections.length > 0) && (
        <Disclosure
          summary={t("groupBelongs")}
          aside={belongsTo(doc, node, t)}
        >
          {doc.meta.pools.length > 0 && (
            <SelectField
              label={t("nodePool")}
              hint={t("nodePoolHint")}
              value={node.pool ?? ""}
              options={[
                { value: "", label: t("nodePoolNone") },
                ...doc.meta.pools.map((pool) => ({
                  value: pool.id,
                  label: pool.label || pool.id,
                })),
              ]}
              onChange={(pool) =>
                store
                  .getState()
                  .setNodePool(nodeId, pool === "" ? undefined : pool)
              }
            />
          )}

          {doc.meta.sections.length > 0 && (
            <SelectField
              label={t("nodeSection")}
              hint={t("nodeSectionHint")}
              value={node.section ?? ""}
              options={[
                { value: "", label: t("nodeSectionNone") },
                ...doc.meta.sections.map((section) => ({
                  value: section.id,
                  label: section.label || section.id,
                })),
              ]}
              onChange={(section) =>
                store
                  .getState()
                  .setNodeSection(nodeId, section === "" ? undefined : section)
              }
            />
          )}
        </Disclosure>
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

/** What a step already belongs to, for the folded panel to say. */
const belongsTo = (
  doc: BitflowDocument,
  node: BitNode,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string => {
  const pool = doc.meta.pools.find((each) => each.id === node.pool);
  const section = doc.meta.sections.find((each) => each.id === node.section);
  const parts = [pool?.label || node.pool, section?.label || node.section];
  const named = parts.filter((part): part is string => Boolean(part));
  return named.length > 0 ? named.join(" · ") : t("groupBelongsNone");
};

/**
 * An attempt positioned at `nodeId`, or `undefined` to start at the beginning.
 *
 * `undefined` rather than a start-node attempt so `<Flow>` creates its own —
 * one fewer thing that can disagree with the document.
 */
const startedAt = (
  doc: BitflowDocument,
  nodeId: string | null,
): AttemptSnapshot | undefined => {
  if (!nodeId) return undefined;
  const created = attemptAt(doc, nodeId);
  return created.ok ? created.value : undefined;
};

/**
 * `nodes.3.data.choices` → that node; `edges.1.condition` → that edge.
 *
 * `null` for a diagnostic about the document itself, which has nothing to
 * select and so stays plain text.
 */
/** Where a problem is, so the list can take the author straight to it. */
type ProblemTarget =
  | { kind: "node"; nodeId: string }
  | { kind: "edge"; edgeId: string }
  /** A group of the flow's own settings, which the panel opens. */
  | { kind: "group"; group: string };

/**
 * Which settings group a `meta.…` path lives in.
 *
 * A pool that draws more than it holds used to report itself as plain text
 * with nowhere to go — `targetOf` only knew about nodes and edges — and now
 * that the groups fold, the settings it names might not even be on screen.
 */
const SETTINGS_GROUP: Array<[RegExp, string]> = [
  [/^meta\.pools/, "pools"],
  [/^meta\.sections/, "sections"],
  [/^meta\.timeLimit/, "timing"],
  [/^meta\.(navigation|allowSkip)/, "moving"],
];

const targetOf =
  (doc: BitflowDocument) =>
  (diagnostic: Diagnostic): ProblemTarget | null => {
    const node = /^nodes\.(\d+)/.exec(diagnostic.path);
    if (node) {
      const id = doc.nodes[Number(node[1])]?.id;
      return id ? { kind: "node", nodeId: id } : null;
    }
    const edge = /^edges\.(\d+)/.exec(diagnostic.path);
    if (edge) {
      const id = doc.edges[Number(edge[1])]?.id;
      return id ? { kind: "edge", edgeId: id } : null;
    }
    for (const [pattern, group] of SETTINGS_GROUP) {
      if (pattern.test(diagnostic.path)) return { kind: "group", group };
    }
    return null;
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
