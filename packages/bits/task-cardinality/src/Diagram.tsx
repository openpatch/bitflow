import { translate, type Locale } from "@bitflow/core";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from "react";
import type { EndStates } from "./evaluate";
import { messages } from "./messages";
import {
  endKey,
  entityById,
  labelsOf,
  type Answer,
  type Data,
  type End,
  type Entity,
  type Relationship,
} from "./schema";

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 600;
const BOX_HEIGHT = 56;
/** How far out from an entity's edge an end's label sits along its line. */
const LABEL_OFFSET = 34;

/**
 * The viewBox shrinks everything with the element, so on a phone the names and
 * labels would be too small to read. Below REFERENCE_WIDTH the shrink is undone,
 * up to MAX_SCALE, the same measure task-graph-path takes.
 */
const REFERENCE_WIDTH = 560;
const MAX_SCALE = 2;

const useDiagramScale = (ref: RefObject<SVGSVGElement | null>): number => {
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

type Point = { x: number; y: number };
type Box = Point & { halfWidth: number; halfHeight: number };

/** A box's size from its name, so a long name is never cut off. */
const boxOf = (entity: Entity, scale: number): Box => ({
  x: entity.x * VIEW_WIDTH,
  y: entity.y * VIEW_HEIGHT,
  halfWidth: (Math.max(120, entity.name.length * 15 + 40) * scale) / 2,
  halfHeight: (BOX_HEIGHT * scale) / 2,
});

/** Where a line from the box's middle toward `toward` leaves the box. */
const exitPoint = (box: Box, toward: Point): Point => {
  const dx = toward.x - box.x;
  const dy = toward.y - box.y;
  if (dx === 0 && dy === 0) return box;
  const t = Math.min(
    dx === 0 ? Infinity : box.halfWidth / Math.abs(dx),
    dy === 0 ? Infinity : box.halfHeight / Math.abs(dy),
  );
  return { x: box.x + dx * t, y: box.y + dy * t };
};

/** A point `distance` along the way from `from` to `to`. */
const along = (from: Point, to: Point, distance: number): Point => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    x: from.x + ((to.x - from.x) / length) * distance,
    y: from.y + ((to.y - from.y) / length) * distance,
  };
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** "Pupil — borrows — Book", for naming a relationship in words. */
export const relationshipName = (data: Data, relationship: Relationship, t: Translate): string =>
  t("relationshipName", {
    from: entityById(data, relationship.from)?.name || "?",
    name: relationship.name || "—",
    to: entityById(data, relationship.to)?.name || "?",
  });

/**
 * The diagram, and under it the controls that answer it.
 *
 * The diagram shows what the learner has chosen at each end, or a question
 * mark; the selects below are how an end is answered, by keyboard, screen
 * reader or finger alike. Nothing is dragged or drawn.
 */
export const Diagram = ({
  data,
  answer,
  states,
  readonly,
  locale,
  showAnswers,
  onChange,
}: {
  data: Data;
  answer?: Answer;
  states?: EndStates;
  readonly?: boolean;
  locale: Locale;
  /** The author's preview: draw the expected labels rather than the learner's. */
  showAnswers?: boolean;
  onChange?: (answer: Answer) => void;
}): ReactElement => {
  const t: Translate = (key, vars) => translate(messages, key, locale, vars);
  const svg = useRef<SVGSVGElement | null>(null);
  const scale = useDiagramScale(svg);
  const id = useId();
  const chen = data.notation !== "uml";

  const valueAt = (relationship: Relationship, end: End): string | undefined =>
    showAnswers
      ? end === "from"
        ? relationship.expectedFrom
        : relationship.expectedTo
      : answer?.ends?.[endKey(relationship.id, end)];

  return (
    <div className="bitflow-cardinality">
      <svg
        ref={svg}
        className="bitflow-cardinality-diagram"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={t("diagramLabel")}
        style={{ "--bitflow-cardinality-scale": scale } as CSSProperties}
      >
        {data.relationships.map((relationship) => {
          const fromEntity = entityById(data, relationship.from);
          const toEntity = entityById(data, relationship.to);
          if (!fromEntity || !toEntity || fromEntity === toEntity) return null;
          const fromBox = boxOf(fromEntity, scale);
          const toBox = boxOf(toEntity, scale);
          const start = exitPoint(fromBox, toBox);
          const end = exitPoint(toBox, fromBox);
          const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
          // On a short line the diamond and the end labels are held to a share
          // of its length, so enlarging them for a phone never stacks them on
          // top of each other.
          const lineLength = Math.hypot(end.x - start.x, end.y - start.y);
          const vertical = Math.abs(end.y - start.y) > Math.abs(end.x - start.x);
          const diamond = Math.min(28 * scale, lineLength * (vertical ? 0.16 : 0.08));
          const labelOffset = Math.min(LABEL_OFFSET * scale, lineLength * 0.22);

          return (
            <g key={relationship.id} className="bitflow-cardinality-relationship">
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
              {chen ? (
                <>
                  <polygon
                    className="bitflow-cardinality-diamond"
                    points={`${middle.x},${middle.y - diamond} ${middle.x + diamond * 2.4},${middle.y} ${middle.x},${middle.y + diamond} ${middle.x - diamond * 2.4},${middle.y}`}
                  />
                  <text className="bitflow-cardinality-verb" x={middle.x} y={middle.y}>
                    {relationship.name}
                  </text>
                </>
              ) : (
                <text className="bitflow-cardinality-verb" x={middle.x} y={middle.y - 14 * scale}>
                  {relationship.name}
                </text>
              )}
              {(["from", "to"] as End[]).map((which) => {
                const near = which === "from" ? start : end;
                const far = which === "from" ? end : start;
                const onLine = along(near, far, labelOffset);
                // Beside the line rather than on it, so the line never runs
                // through the label it carries.
                const length = Math.hypot(far.x - near.x, far.y - near.y) || 1;
                const side = 18 * scale;
                const anchor = {
                  x: onLine.x - ((far.y - near.y) / length) * side,
                  y: onLine.y + ((far.x - near.x) / length) * side,
                };
                const value = valueAt(relationship, which);
                const state = showAnswers ? undefined : states?.[endKey(relationship.id, which)];
                return (
                  <g
                    key={which}
                    className={
                      state ? `bitflow-cardinality-end bitflow-cardinality-end-${state}` : "bitflow-cardinality-end"
                    }
                    transform={`translate(${anchor.x} ${anchor.y})`}
                  >
                    <text>
                      {value || "?"}
                      {state && (state === "correct" ? " ✓" : " ✗")}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {data.entities.map((entity) => {
          const box = boxOf(entity, scale);
          return (
            <g key={entity.id} className="bitflow-cardinality-entity">
              <rect
                x={box.x - box.halfWidth}
                y={box.y - box.halfHeight}
                width={box.halfWidth * 2}
                height={box.halfHeight * 2}
                rx={6 * scale}
              />
              <text x={box.x} y={box.y}>
                {entity.name}
              </text>
            </g>
          );
        })}
      </svg>

      {onChange && !showAnswers && (
        <div className="bitflow-stack-small bitflow-stack">
          {data.relationships.map((relationship) => (
            <fieldset key={relationship.id} className="bitflow-cardinality-row">
              <legend className="bitflow-label">{relationshipName(data, relationship, t)}</legend>
              {(["from", "to"] as End[]).map((which) => {
                const key = endKey(relationship.id, which);
                const entity = entityById(data, relationship[which]);
                const state = states?.[key];
                const selectId = `${id}-${key}`;
                return (
                  <div key={which} className="bitflow-cardinality-end-field">
                    <label htmlFor={selectId}>{t("endAt", { entity: entity?.name || "?" })}</label>
                    <select
                      id={selectId}
                      className={
                        state
                          ? `bitflow-select bitflow-cardinality-select bitflow-cardinality-select-${state}`
                          : "bitflow-select bitflow-cardinality-select"
                      }
                      value={answer?.ends?.[key] ?? ""}
                      disabled={readonly}
                      onChange={(event) => {
                        const ends = { ...answer?.ends };
                        if (event.target.value === "") delete ends[key];
                        else ends[key] = event.target.value;
                        onChange({ ends });
                      }}
                    >
                      <option value="">{t("choose")}</option>
                      {labelsOf(data.notation).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {state && <span className="bitflow-visually-hidden">{t(state)}</span>}
                  </div>
                );
              })}
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
};
