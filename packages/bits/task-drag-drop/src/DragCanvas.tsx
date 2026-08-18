import { translate, type Locale } from "@bitflow/core";
import {
  useCallback,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { Judged } from "./evaluate";
import { messages } from "./messages";
import type { Data, Element, Placement } from "./schema";
import { usePointerDrag } from "./usePointerDrag";

/** A drag in progress, in the play area's own 0..1 space. */
type Drag = {
  elementId: string;
  /** Which placement is moving, when the element has been put down already. */
  index: number | null;
  /** Where in the element the pointer took hold, so it does not jump. */
  grabX: number;
  grabY: number;
  x: number;
  y: number;
  moved: boolean;
};

/** How far one arrow-key press moves an element; Shift makes it coarse. */
const NUDGE = 0.01;
const NUDGE_FAST = 0.05;

/**
 * The play area: elements on the picture, and invisible regions underneath.
 *
 * Nothing snaps. An element is dragged wherever the learner wants and stays
 * exactly there; which region it turns out to be sitting on is worked out at
 * marking time and never shown while answering. That is what makes the task a
 * judgement about the picture rather than about which box lights up.
 *
 * Because the regions are invisible, "choose an element, then choose a zone"
 * is no longer a path anyone can take — there is nothing to choose. Keyboard
 * users move an element with the arrow keys instead, which is the same freedom
 * a pointer has, at the same resolution.
 */
export const DragCanvas = ({
  data,
  placements,
  judged,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  placements: Placement[];
  /** Per-placement outcome once the answer has been checked. */
  judged?: Judged[];
  locale: Locale;
  readonly?: boolean;
  onChange: (placements: Placement[]) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  /**
   * The drag lives in a ref, not in state, and a counter triggers the redraw.
   *
   * A pointer gesture is three events that can arrive within one frame — a
   * flick on a phone, or a synthetic drag from a test harness. Reading it from
   * state means `pointerup` sees whatever was there before `pointerdown`
   * rendered, and the drop is silently lost.
   */
  const dragRef = useRef<Drag | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  const [announcement, setAnnouncement] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);

  const elementById = (id: string): Element | undefined =>
    data.elements.find((element) => element.id === id);
  const nameOf = (element: Element) => element.label || element.id;

  const stateOf = (index: number) => judged?.[index]?.state;

  /** Client coordinates as fractions of the play area. */
  const toFractions = useCallback((clientX: number, clientY: number) => {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return null;
    return {
      x: (clientX - box.left) / box.width,
      y: (clientY - box.top) / box.height,
    };
  }, []);

  /** Keeps a box on the picture, so nothing can be lost off the edge. */
  const clampTo = (element: Element, x: number, y: number) => ({
    x: Math.min(Math.max(x, 0), 1 - element.width),
    y: Math.min(Math.max(y, 0), 1 - element.height),
  });

  /** Writes a position, adding the placement if the element had none. */
  const put = (element: Element, index: number | null, x: number, y: number) => {
    if (readonly) return;
    const at = clampTo(element, x, y);
    const next =
      index === null
        ? [...placements, { elementId: element.id, ...at }]
        : placements.map((placement, i) =>
            i === index ? { ...placement, ...at } : placement,
          );
    onChange(next);
  };

  const startDrag = (
    event: ReactPointerEvent,
    element: Element,
    index: number | null,
  ) => {
    if (readonly || event.button !== 0) return;
    const at = toFractions(event.clientX, event.clientY);
    if (!at) return;

    const origin =
      index === null ? { x: element.x, y: element.y } : placements[index];

    dragRef.current = {
      elementId: element.id,
      // A cloning element leaves its original behind: the drag creates a new
      // placement instead of moving the one under the pointer.
      index: index === null && element.multiple ? null : index,
      grabX: at.x - origin.x,
      grabY: at.y - origin.y,
      x: origin.x,
      y: origin.y,
      moved: false,
    };
    redraw();
  };

  const moveDrag = (event: PointerEvent | ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const at = toFractions(event.clientX, event.clientY);
    if (!at) return;

    const x = at.x - drag.grabX;
    const y = at.y - drag.grabY;
    dragRef.current = {
      ...drag,
      x,
      y,
      moved: drag.moved || Math.abs(x - drag.x) > 0.004 || Math.abs(y - drag.y) > 0.004,
    };
    redraw();
  };

  const endDrag = (event: PointerEvent | ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const element = elementById(drag.elementId);
    dragRef.current = null;
    redraw();
    if (!element) return;

    /*
     * The release position, not the last one a move reported: some input
     * stacks coalesce moves, and a quick flick can deliver press and release
     * with nothing in between. That is still a drag.
     */
    const at = toFractions(event.clientX, event.clientY);
    const x = at ? at.x - drag.grabX : drag.x;
    const y = at ? at.y - drag.grabY : drag.y;

    const origin =
      drag.index === null
        ? { x: element.x, y: element.y }
        : (placements[drag.index] ?? { x: element.x, y: element.y });
    const moved =
      drag.moved ||
      Math.abs(x - origin.x) > 0.004 ||
      Math.abs(y - origin.y) > 0.004;
    if (!moved) return;

    put(element, drag.index, x, y);
    setAnnouncement(t("moved", { element: nameOf(element) }));
  };

  // The window sees the whole gesture: the pointer leaves the element almost
  // immediately, and a release outside the page never reaches it at all.
  usePointerDrag(moveDrag, endDrag);

  /** Arrow keys, so the picture can be answered without a pointer. */
  const nudge = (
    event: ReactKeyboardEvent,
    element: Element,
    index: number | null,
  ) => {
    if (readonly) return;
    const step = event.shiftKey ? NUDGE_FAST : NUDGE;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = deltas[event.key];
    if (!delta) return;

    event.preventDefault();
    const from = index === null ? { x: element.x, y: element.y } : placements[index];
    put(element, index, from.x + delta[0], from.y + delta[1]);
    setAnnouncement(t("moved", { element: nameOf(element) }));
  };

  /** Sends an element back to where the author put it. */
  const returnHome = (element: Element, index: number) => {
    if (readonly) return;
    onChange(placements.filter((_, i) => i !== index));
    setAnnouncement(t("returned", { element: nameOf(element) }));
  };

  const boxStyle = (
    box: { x: number; y: number; width: number; height: number },
    opacity: number,
  ): CSSProperties =>
    ({
      left: `${box.x * 100}%`,
      top: `${box.y * 100}%`,
      width: `${box.width * 100}%`,
      height: `${box.height * 100}%`,
      "--bitflow-dragdrop-opacity": String(opacity / 100),
    }) as CSSProperties;

  const renderContent = (element: Element) =>
    element.kind === "image" && element.src ? (
      <img src={element.src} alt={nameOf(element)} draggable={false} />
    ) : (
      <span>{nameOf(element)}</span>
    );

  /** One element, at home or wherever it was left. */
  const renderElement = (
    element: Element,
    index: number | null,
    placement?: Placement,
  ) => {
    const drag = dragRef.current;
    const dragging =
      drag?.elementId === element.id && drag.index === index && drag.moved;
    const position = dragging
      ? { x: drag.x, y: drag.y }
      : (placement ?? { x: element.x, y: element.y });
    const state = index === null ? undefined : stateOf(index);

    const classes = ["bitflow-dragdrop-element"];
    if (state) classes.push(`bitflow-dragdrop-element-${state}`);
    if (dragging) classes.push("bitflow-dragdrop-element-dragging");
    if (placement) classes.push("bitflow-dragdrop-element-placed");

    return (
      <button
        key={index === null ? element.id : `${element.id}-${index}`}
        type="button"
        className={classes.join(" ")}
        style={boxStyle(
          { ...position, width: element.width, height: element.height },
          element.backgroundOpacity,
        )}
        disabled={readonly}
        aria-label={
          placement
            ? t("placedElement", {
                element: nameOf(element),
                x: Math.round(position.x * 100),
                y: Math.round(position.y * 100),
              })
            : element.multiple
              ? t("cloneable", { element: nameOf(element) })
              : nameOf(element)
        }
        onPointerDown={(event) => startDrag(event, element, index)}
        onKeyDown={(event) => {
          // Backspace on a placed element sends it back where it came from.
          if (placement && index !== null && event.key === "Backspace") {
            event.preventDefault();
            returnHome(element, index);
            return;
          }
          nudge(event, element, index);
        }}
      >
        {renderContent(element)}
        {state && (
          <span className="bitflow-visually-hidden"> {t(`placement-${state}`)}</span>
        )}
      </button>
    );
  };

  return (
    <div className="bitflow-dragdrop">
      <div
        className="bitflow-dragdrop-area"
        ref={areaRef}
        style={{ aspectRatio: `${data.size.width} / ${data.size.height}` }}
        // A native drag starting on any descendant would take the pointer
        // stream with it, and the element would never be released.
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

        {/*
          The regions are not drawn and not in the tab order. Marking them
          would say where the answer goes; naming them to a screen reader
          would say it only to some people. They exist at marking time.
        */}

        {/* Elements still where the author put them. A cloning one stays, so
            it can be used again. */}
        {data.elements
          .filter(
            (element) =>
              element.multiple ||
              !placements.some((placement) => placement.elementId === element.id),
          )
          .map((element) => renderElement(element, null))}

        {/* Elements the learner has moved, wherever they left them. */}
        {placements.map((placement, index) => {
          const element = elementById(placement.elementId);
          return element ? renderElement(element, index, placement) : null;
        })}
      </div>

      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
