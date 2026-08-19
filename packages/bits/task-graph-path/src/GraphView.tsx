import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { routeEdges } from "./graph";
import { messages } from "./messages";
import {
  isSequence,
  nameOf,
  picks,
  type Data,
  type GraphEdge,
} from "./schema";

/**
 * The diagram's own coordinates. Fixed and square-unitted, so a circle is round
 * whatever size the diagram is drawn at, and the stylesheet holds the element
 * to the same 5:3 shape — which is also what makes a pointer position inside
 * the element mean a position inside the diagram.
 */
export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 600;
const RADIUS = 34;

const at = (fraction: number, extent: number) => fraction * extent;

/**
 * Where a connection's line should stop: at the edge of the circle rather than
 * at its middle, or an arrowhead would be drawn underneath the place it points
 * at.
 */
const endpoints = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  gap: number,
) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  return {
    x1: fromX + unitX * RADIUS,
    y1: fromY + unitY * RADIUS,
    x2: toX - unitX * gap,
    y2: toY - unitY * gap,
  };
};

export const GraphView = ({
  data,
  chosen,
  locale,
  readonly,
  correctPrefix,
  onChange,
  onMoveNode,
}: {
  data: Data;
  chosen: string[];
  locale: Locale;
  readonly?: boolean;
  /** How much of a traversal was right, when it has been marked. */
  correctPrefix?: number;
  onChange?: (chosen: string[]) => void;
  /** Authoring only: dragging a place about moves it. */
  onMoveNode?: (id: string, x: number, y: number) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const rawId = useId();
  const arrow = `bitflow-graph-arrow-${rawId.replace(/[^\w-]/g, "")}`;
  const svg = useRef<SVGSVGElement | null>(null);
  /**
   * The place being dragged, and where it was held: the offset between the
   * pointer and the place's own middle, kept from where the drag began. Without
   * it, pressing anywhere but the exact centre snaps the place under the cursor
   * before it has moved at all.
   */
  const dragging = useRef<{ id: string; dx: number; dy: number } | undefined>(
    undefined,
  );
  const [announcement, setAnnounce] = useState("");

  const sequence = isSequence(data.goal);
  const choosing = picks(data.goal);
  const live = !readonly && onChange !== undefined;

  const chosenSet = new Set(chosen);
  /** The connections to draw as part of the answer. */
  const usedEdges = new Set(
    choosing === "edges" ? chosen : sequence ? routeEdges(data, chosen) : [],
  );

  const announce = (key: string, vars?: Record<string, string | number>) =>
    setAnnounce(t(key, vars));

  const choose = (id: string) => {
    if (!live) return;
    if (sequence) {
      onChange([...chosen, id]);
      announce("added", { place: nameOf(data, id), count: chosen.length + 1 });
      return;
    }
    // A set rather than a sequence: choosing again takes it back out.
    const next = chosenSet.has(id)
      ? chosen.filter((other) => other !== id)
      : [...chosen, id];
    onChange(next);
    announce(chosenSet.has(id) ? "removed" : "added", {
      place: labelOf(id),
      count: next.length,
    });
  };

  const labelOf = (id: string): string =>
    choosing === "edges" ? edgeName(data, id, t) : nameOf(data, id);

  // --- authoring: drag a place about ---------------------------------------

  /** Where a pointer is, as a fraction of the diagram, or nothing off it. */
  const fractionAt = (
    event: PointerEvent | ReactPointerEvent,
  ): { x: number; y: number } | undefined => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return undefined;
    return {
      x: (event.clientX - box.left) / box.width,
      y: (event.clientY - box.top) / box.height,
    };
  };

  const clamp = (value: number) => Math.min(1, Math.max(0, value));

  const moveTo = (event: PointerEvent | ReactPointerEvent) => {
    const held = dragging.current;
    const at = fractionAt(event);
    if (!held || !at || !onMoveNode) return;
    onMoveNode(held.id, clamp(at.x + held.dx), clamp(at.y + held.dy));
  };

  usePointerDrag(
    (event) => moveTo(event),
    () => {
      dragging.current = undefined;
    },
  );

  const nodeAt = (id: string) => data.nodes.find((node) => node.id === id);

  return (
    <div className="bitflow-graph">
      <svg
        ref={svg}
        className="bitflow-graph-diagram"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={t("diagramLabel")}
      >
        {data.directed && (
          <defs>
            <marker
              id={arrow}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
        )}

        {data.edges.map((edge) => {
          const from = nodeAt(edge.source);
          const to = nodeAt(edge.target);
          if (!from || !to) return null;
          const line = endpoints(
            at(from.x, VIEW_WIDTH),
            at(from.y, VIEW_HEIGHT),
            at(to.x, VIEW_WIDTH),
            at(to.y, VIEW_HEIGHT),
            data.directed ? RADIUS + 10 : RADIUS,
          );
          const used = usedEdges.has(edge.id);

          return (
            <g
              key={edge.id}
              className={
                used
                  ? "bitflow-graph-edge bitflow-graph-edge-chosen"
                  : "bitflow-graph-edge"
              }
            >
              <line
                {...line}
                markerEnd={data.directed ? `url(#${arrow})` : undefined}
              />
              {/* A second, invisible and much thicker line: a two-pixel stroke
                  is not something anybody can be asked to hit. */}
              {choosing === "edges" && live && (
                <line
                  {...line}
                  className="bitflow-graph-edge-hit"
                  onClick={() => choose(edge.id)}
                />
              )}
              {data.weighted && (
                <text
                  className="bitflow-graph-weight"
                  x={(line.x1 + line.x2) / 2}
                  y={(line.y1 + line.y2) / 2 - 8}
                  textAnchor="middle"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {data.nodes.map((node) => {
          const order = sequence ? chosen.indexOf(node.id) : -1;
          const marked =
            correctPrefix !== undefined && order !== -1 && order < correctPrefix;

          return (
            <g
              key={node.id}
              className={[
                "bitflow-graph-node",
                chosenSet.has(node.id) ? "bitflow-graph-node-chosen" : "",
                marked ? "bitflow-graph-node-right" : "",
                node.id === data.sourceId ? "bitflow-graph-node-source" : "",
                node.id === data.targetId ? "bitflow-graph-node-target" : "",
                onMoveNode ? "bitflow-graph-node-movable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onPointerDown={(event) => {
                if (!onMoveNode) return;
                const at = fractionAt(event);
                dragging.current = {
                  id: node.id,
                  dx: at ? node.x - at.x : 0,
                  dy: at ? node.y - at.y : 0,
                };
              }}
              onClick={() => choosing === "nodes" && choose(node.id)}
            >
              <circle
                cx={at(node.x, VIEW_WIDTH)}
                cy={at(node.y, VIEW_HEIGHT)}
                r={RADIUS}
              />
              <text
                x={at(node.x, VIEW_WIDTH)}
                y={at(node.y, VIEW_HEIGHT)}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {node.label || node.id}
              </text>
              {/* The step number, so a route can be read off the picture and
                  not only off the list underneath it. */}
              {order !== -1 && (
                <text
                  className="bitflow-graph-step"
                  x={at(node.x, VIEW_WIDTH) + RADIUS}
                  y={at(node.y, VIEW_HEIGHT) - RADIUS}
                  textAnchor="middle"
                >
                  {order + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <details className="bitflow-graph-written">
        <summary>{t("writtenOut")}</summary>
        <ul>
          {data.nodes.map((node) => (
            <li key={node.id}>{describe(data, node.id, t)}</li>
          ))}
        </ul>
      </details>

      {/* Always rendered, disabled once the answer is in: what was chosen is
          most worth reading when it is being looked back at. */}
      <Controls
        data={data}
        chosen={chosen}
        locale={locale}
        readonly={!live}
        onChange={onChange ?? (() => {})}
        choose={choose}
        announce={announce}
      />

      <p aria-live="polite" className="bitflow-visually-hidden">
        {announcement}
      </p>
    </div>
  );
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** A connection, in words, since a line on a picture is not a name. */
export const edgeName = (data: Data, edgeId: string, t: Translate): string => {
  const edge = data.edges.find((other) => other.id === edgeId);
  if (!edge) return edgeId;
  const vars = {
    from: nameOf(data, edge.source),
    to: nameOf(data, edge.target),
    weight: edge.weight,
  };
  return t(data.weighted ? "edgeWeighted" : "edgePlain", vars);
};

/** One place and what it joins, so the diagram is never the only source. */
const describe = (data: Data, id: string, t: Translate): string => {
  const neighbours = data.edges
    .filter(
      (edge) =>
        edge.source === id || (!data.directed && edge.target === id),
    )
    .map((edge: GraphEdge) => {
      const other = edge.source === id ? edge.target : edge.source;
      const name = nameOf(data, other);
      return data.weighted
        ? t("withWeight", { place: name, weight: edge.weight })
        : name;
    });

  const place = nameOf(data, id);
  if (neighbours.length === 0) {
    return t(data.directed ? "leadsToNothing" : "joinedToNothing", { place });
  }
  return t(data.directed ? "leadsTo" : "joinedTo", {
    place,
    neighbours: neighbours.join(", "),
  });
};

/**
 * The keyboard route, and the one a screen reader meets: buttons for a
 * sequence, checkboxes for a set. Not a fallback bolted on — clicking the
 * diagram does exactly what these do, and nothing more.
 */
const Controls = ({
  data,
  chosen,
  locale,
  readonly,
  onChange,
  choose,
  announce,
}: {
  data: Data;
  chosen: string[];
  locale: Locale;
  readonly?: boolean;
  onChange: (chosen: string[]) => void;
  choose: (id: string) => void;
  announce: (key: string, vars?: Record<string, string | number>) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);
  const sequence = isSequence(data.goal);
  const choosing = picks(data.goal);
  const chosenSet = new Set(chosen);

  if (!sequence) {
    return (
      <fieldset className="bitflow-field">
        <legend className="bitflow-label">
          {choosing === "edges"
            ? t("connectionsLabel")
            : t("chosenSide", { source: nameOf(data, data.sourceId) })}
        </legend>
        {(choosing === "edges" ? data.edges : data.nodes).map((item) => {
          const label =
            choosing === "edges"
              ? edgeName(data, item.id, t)
              : t("sideOf", {
                  place: nameOf(data, item.id),
                  source: nameOf(data, data.sourceId),
                });
          return (
            <label key={item.id} className="bitflow-option">
              <input
                type="checkbox"
                checked={chosenSet.has(item.id)}
                disabled={readonly}
                onChange={() => choose(item.id)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  return (
    <div className="bitflow-stack-small">
      <div className="bitflow-field">
        <span className="bitflow-label">
          {data.goal === "traversal" ? t("chosenOrder") : t("chosenRoute")}
        </span>
        {chosen.length === 0 ? (
          <p className="bitflow-text-muted">{t("nothingChosen")}</p>
        ) : (
          <ol className="bitflow-graph-chosen">
            {chosen.map((id, index) => (
              // Keyed by position as well as id on purpose: the same place can
              // legitimately appear twice in an answer that is being built.
              <li key={`${id}-${index}`} className="bitflow-graph-chip">
                {nameOf(data, id)}
              </li>
            ))}
          </ol>
        )}
      </div>

      <fieldset className="bitflow-field">
        <legend className="bitflow-label">{t("placesLabel")}</legend>
        <div className="bitflow-row">
          {data.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className="bitflow-button bitflow-button-secondary"
              disabled={readonly}
              onClick={() => choose(node.id)}
            >
              {t("addPlace", { place: nameOf(data, node.id) })}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="bitflow-row">
        <button
          type="button"
          className="bitflow-button bitflow-button-quiet"
          disabled={readonly || chosen.length === 0}
          onClick={() => {
            const last = chosen[chosen.length - 1];
            onChange(chosen.slice(0, -1));
            announce("removed", {
              place: nameOf(data, last),
              count: chosen.length - 1,
            });
          }}
        >
          {t("removeLast")}
        </button>
        <button
          type="button"
          className="bitflow-button bitflow-button-quiet"
          disabled={readonly || chosen.length === 0}
          onClick={() => {
            onChange([]);
            announce("cleared");
          }}
        >
          {t("startAgain")}
        </button>
      </div>
    </div>
  );
};
