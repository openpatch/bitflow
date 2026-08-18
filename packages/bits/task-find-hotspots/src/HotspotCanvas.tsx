import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useCallback,
  useReducer,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { formMessages } from "./formMessages";
import type { Box } from "./geometry";
import type { Data } from "./schema";

/** What the author is doing with the pointer right now. */
type Gesture =
  | { kind: "draw"; from: { x: number; y: number }; to: { x: number; y: number } }
  | { kind: "move" | "resize"; id: string; start: { x: number; y: number }; box: Box };

/**
 * The picture, authored by drawing on it.
 *
 * A region is a rectangle over a photograph, and typing four numbers between 0
 * and 1 to place one is not something to ask of a teacher who can see exactly
 * where it goes. The numeric fields stay, because drawing needs a pointer and
 * the task has to be authorable without one.
 */
export const HotspotCanvas = ({
  data,
  locale,
  selectedId,
  onSelect,
  onDraw,
  onMove,
}: {
  data: Data;
  locale: Locale;
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onDraw: (box: Box) => void;
  onMove: (id: string, box: Box) => void;
}): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  const areaRef = useRef<HTMLDivElement>(null);
  /**
   * The gesture lives in a ref: `pointerup` can arrive before a state update
   * has rendered, and one read from state would already be gone.
   */
  const gestureRef = useRef<Gesture | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  const setGesture = (next: Gesture | null) => {
    gestureRef.current = next;
    redraw();
  };

  const toFractions = useCallback((clientX: number, clientY: number) => {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return null;
    return {
      x: clamp((clientX - box.left) / box.width),
      y: clamp((clientY - box.top) / box.height),
    };
  }, []);

  const drawn = (from: { x: number; y: number }, to: { x: number; y: number }): Box => ({
    x: Math.min(from.x, to.x),
    y: Math.min(from.y, to.y),
    width: Math.abs(to.x - from.x),
    height: Math.abs(to.y - from.y),
  });

  const boxOf = (id: string): Box | undefined => {
    const hotspot = data.hotspots.find((candidate) => candidate.id === id);
    return (
      hotspot && {
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
      }
    );
  };

  /** Where a region sits, including a gesture in progress. */
  const liveBox = (id: string): Box => {
    const gesture = gestureRef.current;
    const box = boxOf(id)!;
    return gesture && gesture.kind !== "draw" && gesture.id === id
      ? gesture.box
      : box;
  };

  const move = (event: PointerEvent | ReactPointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const at = toFractions(event.clientX, event.clientY);
    if (!at) return;

    if (gesture.kind === "draw") {
      setGesture({ ...gesture, to: at });
      return;
    }

    const box = boxOf(gesture.id);
    if (!box) return;
    const dx = at.x - gesture.start.x;
    const dy = at.y - gesture.start.y;

    setGesture({
      ...gesture,
      box:
        gesture.kind === "move"
          ? {
              // Kept on the picture: a region half off the edge cannot be
              // clicked in full, and the numbers do not show that.
              ...box,
              x: clamp(box.x + dx, 1 - box.width),
              y: clamp(box.y + dy, 1 - box.height),
            }
          : {
              ...box,
              width: clamp(box.width + dx, 1 - box.x, 0.02),
              height: clamp(box.height + dy, 1 - box.y, 0.02),
            },
    });
  };

  const end = () => {
    const finished = gestureRef.current;
    setGesture(null);
    if (!finished) return;

    if (finished.kind === "draw") {
      const box = drawn(finished.from, finished.to);
      // A stray click is not an attempt to draw a region nobody can hit.
      if (box.width < 0.02 || box.height < 0.02) return;
      onDraw(box);
      return;
    }
    onMove(finished.id, finished.box);
  };

  usePointerDrag(move, end);

  const startOnPicture = (event: ReactPointerEvent) => {
    const at = toFractions(event.clientX, event.clientY);
    if (!at) return;
    onSelect(undefined);
    setGesture({ kind: "draw", from: at, to: at });
  };

  const startOnRegion = (
    event: ReactPointerEvent,
    id: string,
    kind: "move" | "resize",
  ) => {
    event.stopPropagation();
    const at = toFractions(event.clientX, event.clientY);
    const box = boxOf(id);
    if (!at || !box) return;
    onSelect(id);
    setGesture({ kind, id, start: at, box });
  };

  const style = (box: Box, ellipse: boolean) => ({
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
    borderRadius: ellipse ? "50%" : undefined,
  });

  return (
    <div className="bitflow-hotspots-editor">
      <p className="bitflow-hint">{t("canvasHint")}</p>
      <div
        className="bitflow-hotspots-picture bitflow-hotspots-picture-editing"
        ref={areaRef}
        style={{ aspectRatio: `${data.size.width} / ${data.size.height}` }}
        onPointerDown={startOnPicture}
        // A native drag starting on the picture would take the pointer stream
        // with it, and the region would never be finished.
        onDragStart={(event) => event.preventDefault()}
      >
        {data.background.src ? (
          <img
            className="bitflow-hotspots-image"
            src={data.background.src}
            alt={data.background.alt}
            draggable={false}
          />
        ) : (
          <div className="bitflow-hotspots-image bitflow-hotspots-noimage" />
        )}

        {data.hotspots.map((hotspot) => {
          const classes = ["bitflow-hotspots-handle"];
          if (hotspot.correct) classes.push("bitflow-hotspots-handle-correct");
          if (hotspot.id === selectedId) {
            classes.push("bitflow-hotspots-handle-selected");
          }
          return (
            <div
              key={hotspot.id}
              className={classes.join(" ")}
              style={style(liveBox(hotspot.id), hotspot.shape === "ellipse")}
              onPointerDown={(event) => startOnRegion(event, hotspot.id, "move")}
            >
              <span className="bitflow-hotspots-handle-label">
                {hotspot.label || t("unnamedRegion")}
              </span>
              <span
                className="bitflow-hotspots-resize"
                onPointerDown={(event) =>
                  startOnRegion(event, hotspot.id, "resize")
                }
              />
            </div>
          );
        })}

        {gestureRef.current?.kind === "draw" && (
          <div
            className="bitflow-hotspots-drawing"
            style={style(
              drawn(gestureRef.current.from, gestureRef.current.to),
              false,
            )}
          />
        )}
      </div>
    </div>
  );
};

/** Keeps a fraction on the picture, and above a minimum where given. */
const clamp = (value: number, max = 1, min = 0): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
