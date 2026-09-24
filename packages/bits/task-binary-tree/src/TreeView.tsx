import { translate, type Locale } from "@bitflow/core";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from "react";
import type { PlacementState } from "./evaluate";
import { messages } from "./messages";
import { layoutTree, treeWithPlacements, type LayoutSlot } from "./tree";
import type { Answer, Data, Tree } from "./schema";

export const VIEW_WIDTH = 1000;
/** Height given to one level of the tree, in viewBox units. */
const LEVEL_HEIGHT = 130;
const RADIUS = 34;

/**
 * The viewBox scales every user unit by rendered-width / VIEW_WIDTH, so a node
 * of fixed radius and a label of fixed size shrink with the element — to an
 * unreadable size on a phone. Below REFERENCE_WIDTH that shrink is undone, up
 * to MAX_SCALE, the same measure task-graph-path takes.
 */
const REFERENCE_WIDTH = 560;
const MAX_SCALE = 2.2;

const useTreeScale = (ref: RefObject<SVGSVGElement | null>): number => {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (!width) return;
      setScale(Math.min(MAX_SCALE, Math.max(1, REFERENCE_WIDTH / width)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export type TreeViewProps = {
  data: Data;
  answer?: Answer;
  locale: Locale;
  readonly?: boolean;
  /** How many chosen places were right before the first wrong one, once marked. */
  correctPrefix?: number;
  /** Per placement, once marked ("insert" only). */
  placementStates?: PlacementState[];
  onChange?: (answer: Answer) => void;
  /** The diagram alone, for the authoring form's preview — no order, no buttons. */
  diagramOnly?: boolean;
};

/**
 * The tree as a diagram and as a list of buttons, answering by tapping.
 *
 * Both halves do the same things. The diagram is for seeing the shape and for
 * a pointer; the buttons under it are the keyboard and screen-reader route,
 * and on a small phone often the easier one to hit. Nothing is dragged, so
 * nothing here takes a swipe away from the page.
 */
export const TreeView = ({
  data,
  answer,
  locale,
  readonly,
  correctPrefix,
  placementStates,
  onChange,
  diagramOnly,
}: TreeViewProps): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const svg = useRef<SVGSVGElement | null>(null);
  const scale = useTreeScale(svg);
  const [announcement, setAnnouncement] = useState("");

  const live = !readonly && onChange !== undefined;
  const inserting = data.mode === "insert";
  const sequence = answer?.sequence ?? [];
  const placements = answer?.placements ?? [];
  const marked = correctPrefix !== undefined || placementStates !== undefined;

  // In "insert" the learner's own tree is what is drawn: each key they place
  // stays where they put it, and the next one is placed into that tree.
  const tree: Tree = inserting ? treeWithPlacements(data.tree, placements) : data.tree;
  const layout = layoutTree(tree.nodes, tree.root, inserting);
  const viewHeight = LEVEL_HEIGHT * (layout.depth + 1);
  const at = (point: { x: number; y: number }) => ({
    x: point.x * VIEW_WIDTH,
    y: point.y * viewHeight,
  });
  const position = new Map(layout.nodes.map((node) => [node.id, at(node)]));

  // One column per node (and per empty place, when inserting): the radius is
  // held under half a column, so however much a phone scales the nodes up
  // they never grow into their neighbours.
  const columns = layout.nodes.length + layout.slots.length;
  const radius = Math.min(RADIUS * scale, (0.42 * VIEW_WIDTH) / Math.max(columns, 1));
  const label = (id: string) => tree.nodes.find((node) => node.id === id)?.label || id;

  const nextKey = inserting ? data.insertKeys[placements.length] : undefined;

  const emit = (next: Partial<Answer>) =>
    onChange?.({
      sequence,
      placements,
      ...(answer?.notFound !== undefined ? { notFound: answer.notFound } : {}),
      ...next,
    });

  const choose = (id: string) => {
    if (!live) return;
    if (sequence.includes(id)) {
      setAnnouncement(t("alreadyChosen", { key: label(id) }));
      return;
    }
    emit({ sequence: [...sequence, id] });
    setAnnouncement(t("added", { key: label(id), step: sequence.length + 1 }));
  };

  const slotName = (slot: LayoutSlot) =>
    slot.side === "root"
      ? t("slotRoot")
      : t(slot.side === "left" ? "slotLeft" : "slotRight", {
          key: label(slot.parentId as string),
        });

  const place = (slot: LayoutSlot) => {
    if (!live || nextKey === undefined) return;
    emit({
      placements: [...placements, { key: nextKey, parent: slot.parentId, side: slot.side }],
    });
    setAnnouncement(t("placed", { key: nextKey, where: slotName(slot) }));
  };

  const undo = () => {
    if (!live) return;
    if (inserting) emit({ placements: placements.slice(0, -1) });
    else if (answer?.notFound) emit({ notFound: false });
    else emit({ sequence: sequence.slice(0, -1) });
    setAnnouncement(t("undone"));
  };

  const reset = () => {
    if (!live) return;
    onChange?.({ sequence: [], placements: [] });
    setAnnouncement(t("cleared"));
  };

  /** Where a chosen place was in the learner's order, 1-based, or 0. */
  const stepOf = (id: string) => sequence.indexOf(id) + 1;

  /** A chosen step's verdict once marked: right up to the first mistake. */
  const stepState = (step: number): "correct" | "wrong" | undefined =>
    correctPrefix === undefined ? undefined : step <= correctPrefix ? "correct" : "wrong";

  /** A placed node's verdict once marked ("insert" ids are `insert-<n>`). */
  const placedState = (id: string) => {
    const match = /^insert-(\d+)$/.exec(id);
    return match && placementStates ? placementStates[Number(match[1])] : undefined;
  };

  const edges = tree.nodes.flatMap((node) =>
    (["left", "right"] as const)
      .map((side) => node[side])
      .filter((child): child is string => child !== undefined && position.has(child))
      .map((child) => ({ from: node.id, to: child })),
  );

  return (
    <div className="bitflow-tree">
      {inserting && (
        <p className="bitflow-tree-next" aria-live="polite">
          {nextKey !== undefined ? t("nextKey", { key: nextKey }) : t("allPlaced")}
        </p>
      )}

      {/* A wide tree gets a minimum width per column and scrolls sideways
          inside this box, rather than shrinking its nodes below a size a
          finger can pick out on a phone. */}
      <div className="bitflow-tree-scroll">
      <svg
        ref={svg}
        className="bitflow-tree-diagram"
        viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
        role="img"
        aria-label={t("diagramLabel")}
        style={
          {
            "--bitflow-tree-scale": Math.min(scale, radius / RADIUS),
            "--bitflow-tree-columns": columns,
          } as CSSProperties
        }
      >
        {edges.map((edge) => {
          const from = position.get(edge.from)!;
          const to = position.get(edge.to)!;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              className="bitflow-tree-edge"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}

        {inserting &&
          layout.slots.map((slot) => {
            const point = at(slot);
            const parent = slot.parentId ? position.get(slot.parentId) : undefined;
            return (
              <g key={`${slot.parentId}-${slot.side}`}>
                {parent && (
                  <line
                    className="bitflow-tree-edge bitflow-tree-edge-empty"
                    x1={parent.x}
                    y1={parent.y}
                    x2={point.x}
                    y2={point.y}
                  />
                )}
                <circle
                  className={live && nextKey !== undefined ? "bitflow-tree-slot bitflow-tree-slot-live" : "bitflow-tree-slot"}
                  cx={point.x}
                  cy={point.y}
                  r={radius * 0.8}
                  onClick={() => place(slot)}
                />
              </g>
            );
          })}

        {layout.nodes.map((node) => {
          const point = at(node);
          const step = stepOf(node.id);
          const state = inserting ? placedState(node.id) : step > 0 ? stepState(step) : undefined;
          const classes = ["bitflow-tree-node"];
          if (step > 0) classes.push("bitflow-tree-node-chosen");
          if (state === "correct") classes.push("bitflow-tree-node-right");
          if (state === "wrong") classes.push("bitflow-tree-node-wrong");
          if (live && !inserting) classes.push("bitflow-tree-node-live");
          return (
            <g
              key={node.id}
              className={classes.join(" ")}
              transform={`translate(${point.x} ${point.y})`}
              onClick={() => !inserting && choose(node.id)}
            >
              <circle r={radius} />
              <text dominantBaseline="central" textAnchor="middle">
                {node.label}
              </text>
              {step > 0 && (
                <text
                  className="bitflow-tree-step"
                  x={radius * 0.9}
                  y={-radius * 0.9}
                  textAnchor="start"
                >
                  {step}
                </text>
              )}
              {state && (
                <text
                  className="bitflow-tree-verdict"
                  x={-radius * 0.9}
                  y={-radius * 0.9}
                  textAnchor="end"
                >
                  {state === "correct" ? "✓" : "✗"}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      {!inserting && !diagramOnly && (
        <div className="bitflow-stack-small bitflow-stack">
          <span className="bitflow-label">{t("chosenLabel")}</span>
          {sequence.length === 0 && !answer?.notFound ? (
            <p className="bitflow-text-muted">{t("nothingChosen")}</p>
          ) : (
            <ol className="bitflow-tree-chosen">
              {sequence.map((id, index) => {
                const state = stepState(index + 1);
                return (
                  <li
                    key={id}
                    className={state ? `bitflow-tree-chip bitflow-tree-chip-${state}` : "bitflow-tree-chip"}
                  >
                    {label(id)}
                    {state && <span className="bitflow-visually-hidden"> {t(state)}</span>}
                  </li>
                );
              })}
              {answer?.notFound && <li className="bitflow-tree-chip">{t("notFound")}</li>}
            </ol>
          )}
        </div>
      )}

      {live && (
        <div className="bitflow-stack-small bitflow-stack">
          <span className="bitflow-label">{t(inserting ? "slotsLabel" : "placesLabel")}</span>
          <div className="bitflow-row">
            {inserting
              ? nextKey !== undefined &&
                layout.slots.map((slot) => (
                  <button
                    key={`${slot.parentId}-${slot.side}`}
                    type="button"
                    className="bitflow-button bitflow-button-secondary"
                    onClick={() => place(slot)}
                  >
                    {slotName(slot)}
                  </button>
                ))
              : layout.nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className="bitflow-button bitflow-button-secondary"
                    disabled={sequence.includes(node.id)}
                    onClick={() => choose(node.id)}
                  >
                    {t("addNode", { key: node.label })}
                  </button>
                ))}
            {data.mode === "search" && (
              <button
                type="button"
                className="bitflow-button bitflow-button-secondary"
                aria-pressed={answer?.notFound === true}
                onClick={() => {
                  emit({ notFound: !answer?.notFound });
                  setAnnouncement(t(answer?.notFound ? "notFoundOff" : "notFoundOn"));
                }}
              >
                {t("notFound")}
              </button>
            )}
          </div>
          <div className="bitflow-row">
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              disabled={
                inserting ? placements.length === 0 : sequence.length === 0 && !answer?.notFound
              }
              onClick={undo}
            >
              {t("undo")}
            </button>
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              disabled={sequence.length === 0 && placements.length === 0 && !answer?.notFound}
              onClick={reset}
            >
              {t("reset")}
            </button>
          </div>
        </div>
      )}

      {inserting && marked && placementStates && (
        <ol className="bitflow-tree-chosen">
          {placements.map((placement, index) => (
            <li
              key={index}
              className={`bitflow-tree-chip bitflow-tree-chip-${placementStates[index] ?? "wrong"}`}
            >
              {placement.key}
              <span className="bitflow-visually-hidden">
                {" "}
                {t(placementStates[index] === "correct" ? "correct" : "wrong")}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
