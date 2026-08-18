import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import { useRef, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import { editorMessages } from "./editorMessages";

/**
 * The inspector's width when nothing has been dragged.
 *
 * Wider than the 320px it used to be: a task's form and the drag-and-drop
 * authoring picture both live in here, and 320 left the picture too small to
 * place anything on.
 */
export const DEFAULT_INSPECTOR = 400;

/** How narrow the inspector may get before its forms stop being usable. */
export const MIN_INSPECTOR = 280;
/** And how much of the editor it may take, so the canvas never disappears. */
export const MAX_INSPECTOR_RATIO = 0.6;

/** Keeps a requested width within what the editor can actually give it. */
export const clampInspector = (width: number, editorWidth: number): number => {
  const most = Math.max(MIN_INSPECTOR, editorWidth * MAX_INSPECTOR_RATIO);
  return Math.round(Math.min(Math.max(width, MIN_INSPECTOR), most));
};

/** One arrow-key press, and the coarser step Shift asks for. */
const STEP = 16;
const STEP_FAST = 64;

/**
 * The grip between the canvas and the inspector.
 *
 * A fixed inspector is the wrong width for everybody: wide enough for a task's
 * form on a laptop leaves a phone-sized canvas on a large screen, and narrow
 * enough to keep the canvas roomy makes the drag-and-drop authoring picture
 * too small to place anything on. Whoever is looking at it knows which they
 * need right now.
 *
 * A real separator, not a decorative bar: it reports its position, and the
 * arrow keys move it, so the width is adjustable without a pointer.
 */
export const InspectorResizer = ({
  width,
  editorWidth,
  locale,
  onResize,
}: {
  width: number;
  /** The editor's own width, which decides how far the grip may travel. */
  editorWidth: number;
  locale: Locale;
  onResize: (width: number) => void;
}): ReactElement => {
  const start = useRef<{ x: number; width: number } | null>(null);

  usePointerDrag(
    (event) => {
      if (!start.current) return;
      // Dragging left widens the inspector: it grows from the right edge.
      const moved = start.current.x - event.clientX;
      onResize(clampInspector(start.current.width + moved, editorWidth));
    },
    () => {
      start.current = null;
    },
  );

  const begin = (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    start.current = { x: event.clientX, width };
  };

  const most = Math.max(MIN_INSPECTOR, Math.round(editorWidth * MAX_INSPECTOR_RATIO));

  return (
    <div
      className="bitflow-editor-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={translate(editorMessages, "resizeInspector", locale)}
      aria-valuenow={width}
      aria-valuemin={MIN_INSPECTOR}
      aria-valuemax={most}
      tabIndex={0}
      onPointerDown={begin}
      onKeyDown={(event) => {
        const step = event.shiftKey ? STEP_FAST : STEP;
        const delta =
          event.key === "ArrowLeft" ? step : event.key === "ArrowRight" ? -step : 0;
        if (delta === 0) return;
        event.preventDefault();
        onResize(clampInspector(width + delta, editorWidth));
      }}
    />
  );
};
