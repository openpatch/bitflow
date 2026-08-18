import { translate, type Locale } from "@bitflow/core";
import {
  useCallback,
  useReducer,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { formMessages } from "./formMessages";
import { inside, type Box } from "./layout";
import { usePointerDrag } from "./usePointerDrag";
import type { Data, DropZone, Element } from "./schema";

/** What is being dragged on the authoring canvas. */
type Gesture =
  | { kind: "draw"; from: { x: number; y: number }; to: { x: number; y: number } }
  | {
      kind: "move" | "resize";
      target: { type: "zone" | "element"; id: string };
      start: { x: number; y: number };
      origin: Box;
    };

/**
 * The play area, authored by dragging on it.
 *
 * Drop zones are rectangles over a picture, and typing four numbers between 0
 * and 1 to place one is not something a teacher should have to do — they can
 * see where the zone belongs, and dragging is how you say so. The numeric
 * fields stay, because drawing is pointer-only and the task must remain
 * authorable without one.
 *
 * Drag on empty background to draw a new drop zone; drag a zone or an element
 * to move it; drag the handle in its bottom-right corner to resize it.
 */
export const EditorCanvas = ({
  data,
  locale,
  selected,
  onSelect,
  onAddZone,
  onMoveZone,
  onMoveElement,
}: {
  data: Data;
  locale: Locale;
  selected?: { type: "zone" | "element"; id: string };
  onSelect: (target: { type: "zone" | "element"; id: string } | undefined) => void;
  onAddZone: (box: Box) => void;
  onMoveZone: (id: string, box: Box) => void;
  onMoveElement: (id: string, box: Box) => void;
}): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  const areaRef = useRef<HTMLDivElement>(null);
  /**
   * The gesture lives in a ref for the same reason the learner canvas's drag
   * does: `pointerup` can arrive before a state update has rendered, and a
   * gesture read from state would already be gone.
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

  /** The rectangle a draw gesture currently describes. */
  const drawn = (from: { x: number; y: number }, to: { x: number; y: number }): Box => ({
    x: Math.min(from.x, to.x),
    y: Math.min(from.y, to.y),
    width: Math.abs(to.x - from.x),
    height: Math.abs(to.y - from.y),
  });

  const boxOf = (target: { type: "zone" | "element"; id: string }): Box | undefined => {
    const found =
      target.type === "zone"
        ? data.dropZones.find((zone) => zone.id === target.id)
        : data.elements.find((element) => element.id === target.id);
    return found && { x: found.x, y: found.y, width: found.width, height: found.height };
  };

  /** Where a box currently sits, including any gesture in progress. */
  const liveBox = (target: { type: "zone" | "element"; id: string }): Box => {
    const box = boxOf(target)!;
    const gesture = gestureRef.current;
    if (
      !gesture ||
      gesture.kind === "draw" ||
      gesture.target.id !== target.id ||
      gesture.target.type !== target.type
    ) {
      return box;
    }
    return gesture.origin;
  };

  const startOnBackground = (event: ReactPointerEvent) => {
    const at = toFractions(event.clientX, event.clientY);
    if (!at) return;
    onSelect(undefined);
    setGesture({ kind: "draw", from: at, to: at });
  };

  const startOnBox = (
    event: ReactPointerEvent,
    target: { type: "zone" | "element"; id: string },
    kind: "move" | "resize",
  ) => {
    event.stopPropagation();
    const at = toFractions(event.clientX, event.clientY);
    const box = boxOf(target);
    if (!at || !box) return;
    onSelect(target);
    setGesture({ kind, target, start: at, origin: box });
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

    const box = boxOf(gesture.target);
    if (!box) return;
    const dx = at.x - gesture.start.x;
    const dy = at.y - gesture.start.y;

    setGesture({
      ...gesture,
      origin:
        gesture.kind === "move"
          ? {
              // Kept inside the picture: a zone half off the edge cannot be
              // clicked in full, and the author cannot see that afterwards.
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
    if (!finished) return;
    setGesture(null);

    if (finished.kind === "draw") {
      const box = drawn(finished.from, finished.to);
      // A stray click is not an attempt to draw a zone nobody can hit.
      if (box.width < 0.02 || box.height < 0.02) return;
      onAddZone(box);
      return;
    }

    if (finished.target.type === "zone") {
      onMoveZone(finished.target.id, finished.origin);
    } else {
      onMoveElement(finished.target.id, finished.origin);
    }
  };

  // Subscribed after the handlers exist, and only while a gesture is running.
  usePointerDrag(move, end);

  const style = (box: Box): CSSProperties => ({
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  });

  const isSelected = (type: "zone" | "element", id: string) =>
    selected?.type === type && selected.id === id;

  return (
    <div className="bitflow-dragdrop-editor">
      <p className="bitflow-hint">{t("canvasHint")}</p>
      <div
        className="bitflow-dragdrop-area bitflow-dragdrop-area-editing"
        ref={areaRef}
        style={{ aspectRatio: `${data.size.width} / ${data.size.height}` }}
        onPointerDown={startOnBackground}
        /*
         * Anything inside can start a native drag — an image, a run of text —
         * and that gesture takes the pointer stream with it: the release never
         * arrives, and whatever was being drawn or moved stays stuck to the
         * cursor. Refusing it at the canvas covers every descendant.
         */
        onDragStart={(event) => event.preventDefault()}
      >
        {data.background.src ? (
          <img
            className="bitflow-dragdrop-background"
            src={data.background.src}
            alt={data.background.alt}
            // An image is natively draggable, and that gesture swallows the
            // pointer events this canvas is built on: the drag would start a
            // ghost of the picture and never report a release.
            draggable={false}
          />
        ) : (
          <div className="bitflow-dragdrop-background bitflow-dragdrop-noimage" />
        )}

        {data.dropZones.map((zone: DropZone) => (
          <div
            key={zone.id}
            className={
              isSelected("zone", zone.id)
                ? "bitflow-dragdrop-handle bitflow-dragdrop-handle-zone bitflow-dragdrop-handle-selected"
                : "bitflow-dragdrop-handle bitflow-dragdrop-handle-zone"
            }
            style={style(liveBox({ type: "zone", id: zone.id }))}
            onPointerDown={(event) =>
              startOnBox(event, { type: "zone", id: zone.id }, "move")
            }
          >
            <span className="bitflow-dragdrop-handle-label">
              {zone.label || zone.id}
            </span>
            <span
              className="bitflow-dragdrop-resize"
              onPointerDown={(event) =>
                startOnBox(event, { type: "zone", id: zone.id }, "resize")
              }
            />
          </div>
        ))}

        {data.elements.map((element: Element) => (
          <div
            key={element.id}
            className={
              isSelected("element", element.id)
                ? "bitflow-dragdrop-handle bitflow-dragdrop-handle-element bitflow-dragdrop-handle-selected"
                : "bitflow-dragdrop-handle bitflow-dragdrop-handle-element"
            }
            style={style(liveBox({ type: "element", id: element.id }))}
            onPointerDown={(event) =>
              startOnBox(event, { type: "element", id: element.id }, "move")
            }
          >
            <span className="bitflow-dragdrop-handle-label">
              {element.label || element.id}
            </span>
            <span
              className="bitflow-dragdrop-resize"
              onPointerDown={(event) =>
                startOnBox(event, { type: "element", id: element.id }, "resize")
              }
            />
          </div>
        ))}

        {/* The rectangle being drawn right now. */}
        {gestureRef.current?.kind === "draw" && (
          <div
            className="bitflow-dragdrop-drawing"
            style={style(drawn(gestureRef.current.from, gestureRef.current.to))}
          />
        )}
      </div>
    </div>
  );
};

/** Keeps a fraction inside the picture, and above a minimum where given. */
const clamp = (value: number, max = 1, min = 0): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export { inside };
