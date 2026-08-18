import {
  useCallback,
  useReducer,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { usePointerDrag } from "./usePointerDrag";

/** A rectangle in a picture's own 0–1 space, never in pixels. */
export type Box = { x: number; y: number; width: number; height: number };

export type BoxEditorItem = {
  id: string;
  /** Drawn in the corner of the box, and the only way to tell two apart. */
  label: string;
  box: Box;
  /** The task's own class for this outline — the colours belong to the task. */
  className?: string;
  /** Draw the ellipse inscribed in the box instead of the box. */
  ellipse?: boolean;
};

/** What the author is doing with the pointer right now. */
type Gesture =
  | { kind: "draw"; from: { x: number; y: number }; to: { x: number; y: number } }
  | { kind: "move" | "resize"; id: string; start: { x: number; y: number }; box: Box };

/**
 * Rectangles drawn on a picture, for tasks that place things by eye.
 *
 * Every image task has the same authoring problem — a region over a
 * photograph, positioned by four numbers between 0 and 1 — and asking a
 * teacher to type those when they can see exactly where the region goes is
 * asking the wrong thing. This is the dragging half; each task keeps its own
 * numeric fields, because drawing needs a pointer and a task has to be
 * authorable without one.
 *
 * The task supplies the boxes, their names and their colours, and is told when
 * one is drawn, moved or resized. It owns the data; this owns the gesture.
 */
export const BoxEditor = ({
  items,
  background,
  aspectRatio,
  selectedId,
  hint,
  minSize = 0.02,
  drawable = true,
  onSelect,
  onDraw,
  onChange,
}: {
  items: BoxEditorItem[];
  background: { src: string; alt: string };
  /** The picture's shape, as a CSS `aspect-ratio`. */
  aspectRatio: string;
  selectedId?: string;
  /** One line above the picture saying what dragging does. */
  hint?: string;
  /** Smallest box a drag may produce, as a fraction. */
  minSize?: number;
  /** Whether dragging bare picture draws a new box. */
  drawable?: boolean;
  onSelect?: (id: string | undefined) => void;
  onDraw?: (box: Box) => void;
  onChange: (id: string, box: Box) => void;
}): ReactElement => {
  const areaRef = useRef<HTMLDivElement>(null);
  /**
   * The gesture lives in a ref, not in state: `pointerup` can arrive before a
   * state update has rendered — a flick, or a synthetic drag — and a gesture
   * read from state would already be gone, losing the drop silently.
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

  const boxOf = (id: string): Box | undefined =>
    items.find((item) => item.id === id)?.box;

  /** Where a box sits, including a gesture in progress. */
  const liveBox = (item: BoxEditorItem): Box => {
    const gesture = gestureRef.current;
    return gesture && gesture.kind !== "draw" && gesture.id === item.id
      ? gesture.box
      : item.box;
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
              // Kept on the picture: a box half off the edge cannot be clicked
              // in full, and the numbers do not show that.
              ...box,
              x: clamp(box.x + dx, 1 - box.width),
              y: clamp(box.y + dy, 1 - box.height),
            }
          : {
              ...box,
              width: clamp(box.width + dx, 1 - box.x, minSize),
              height: clamp(box.height + dy, 1 - box.y, minSize),
            },
    });
  };

  const end = () => {
    const finished = gestureRef.current;
    setGesture(null);
    if (!finished) return;

    if (finished.kind === "draw") {
      const box = drawn(finished.from, finished.to);
      // A stray click is not an attempt to draw a box nobody can hit.
      if (box.width < minSize || box.height < minSize) return;
      onDraw?.(box);
      return;
    }
    onChange(finished.id, finished.box);
  };

  // Subscribed for the component's whole life, not only while a gesture runs:
  // subscribing when one starts means waiting for a render, and a quick drag
  // is over before that happens.
  usePointerDrag(move, end);

  const startOnPicture = (event: ReactPointerEvent) => {
    onSelect?.(undefined);
    if (!drawable) return;
    const at = toFractions(event.clientX, event.clientY);
    if (!at) return;
    setGesture({ kind: "draw", from: at, to: at });
  };

  const startOnBox = (
    event: ReactPointerEvent,
    id: string,
    kind: "move" | "resize",
  ) => {
    event.stopPropagation();
    const at = toFractions(event.clientX, event.clientY);
    const box = boxOf(id);
    if (!at || !box) return;
    onSelect?.(id);
    setGesture({ kind, id, start: at, box });
  };

  const style = (box: Box, ellipse?: boolean): CSSProperties => ({
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
    borderRadius: ellipse ? "50%" : undefined,
  });

  return (
    <div className="bitflow-boxeditor">
      {hint && <p className="bitflow-hint">{hint}</p>}
      <div
        className="bitflow-boxeditor-area"
        ref={areaRef}
        style={{ aspectRatio }}
        onPointerDown={startOnPicture}
        /*
         * Anything inside can start a native drag — an image, a run of text —
         * and that gesture takes the pointer stream with it: the release never
         * arrives, and whatever was being drawn stays stuck to the cursor.
         */
        onDragStart={(event) => event.preventDefault()}
      >
        {background.src ? (
          <img
            className="bitflow-boxeditor-image"
            src={background.src}
            alt={background.alt}
            draggable={false}
          />
        ) : (
          <div className="bitflow-boxeditor-image bitflow-boxeditor-noimage" />
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={[
              "bitflow-boxeditor-box",
              item.className,
              item.id === selectedId ? "bitflow-boxeditor-box-selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={style(liveBox(item), item.ellipse)}
            onPointerDown={(event) => startOnBox(event, item.id, "move")}
          >
            <span className="bitflow-boxeditor-label">{item.label}</span>
            <span
              className="bitflow-boxeditor-resize"
              onPointerDown={(event) => startOnBox(event, item.id, "resize")}
            />
          </div>
        ))}

        {gestureRef.current?.kind === "draw" && (
          <div
            className="bitflow-boxeditor-drawing"
            style={style(drawn(gestureRef.current.from, gestureRef.current.to))}
          />
        )}
      </div>
    </div>
  );
};

/** Keeps a fraction on the picture, and above a minimum where given. */
const clamp = (value: number, max = 1, min = 0): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
