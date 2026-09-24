import { translate, type Locale } from "@bitflow/core";
import { useAutoScroll, usePointerDrag } from "@bitflow/element";
import {
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { messages } from "./messages";
import type { Item } from "./schema";

/** An item under the pointer, and where the list would put it down. */
type Drag = {
  id: string;
  /** Where inside the item the pointer took hold, so it does not jump. */
  grabX: number;
  grabY: number;
  /** Where the drag began, which is what tells a drag from a click. */
  fromX: number;
  fromY: number;
  /** The pointer now. */
  x: number;
  y: number;
  /** The item's size, so the lifted copy matches what was picked up. */
  width: number;
  height: number;
  /** The order as it would be if dropped here. */
  order: string[];
  moved: boolean;
};

/**
 * The items, in the order the learner has them.
 *
 * Reordering is the same two decisions however it is done — take this one, put
 * it there — so the pointer and the keyboard share one operation rather than
 * one being a fallback for the other.
 *
 * With a pointer the item is lifted: it follows the cursor at the size it was
 * picked up, and the list opens a gap where it would land. Without that, a
 * drag is a list that rearranges itself under your hand with nothing in it —
 * you can see the result but not the act, and there is no way to tell where a
 * release will put things. The keyboard does the same thing a step at a time,
 * and both say out loud where the item ended up.
 */
export const Sequence = ({
  items,
  order,
  correct,
  locale,
  readonly,
  onReorder,
}: {
  items: Item[];
  /** Item ids, in the learner's current order. */
  order: string[];
  /** Ids that are in the right place, once the answer has been marked. */
  correct?: string[];
  locale: Locale;
  readonly?: boolean;
  onReorder: (order: string[]) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  /**
   * The drag lives in a ref: a gesture is three events that can arrive inside
   * one frame, and one read from state would already be stale by `pointerup`.
   */
  const dragRef = useRef<Drag | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);

  const itemById = (id: string) => items.find((item) => item.id === id);
  const nameOf = (item: Item) => item.label || item.id;
  const marked = correct !== undefined;

  const drag = dragRef.current;
  /** What the list looks like right now, gap and all. */
  const shown = drag ? drag.order : order;

  const say = (id: string, order: string[]) => {
    const item = itemById(id);
    setAnnouncement(
      t("moved", {
        item: item ? nameOf(item) : id,
        position: order.indexOf(id) + 1,
        total: order.length,
      }),
    );
  };

  /** Moves one item to a new index, and says where it landed. */
  const moveTo = (id: string, to: number) => {
    if (readonly) return;
    const from = order.indexOf(id);
    const target = Math.min(Math.max(to, 0), order.length - 1);
    if (from === -1 || from === target) return;

    onReorder(reorder(order, id, target));
    say(id, reorder(order, id, target));
  };

  /** Where the pointer would drop the item, by the rows' middles. */
  const indexAt = (clientY: number): number => {
    const rows = [...(listRef.current?.querySelectorAll("li") ?? [])];
    for (let i = 0; i < rows.length; i++) {
      const box = rows[i].getBoundingClientRect();
      if (clientY < box.top + box.height / 2) return i;
    }
    return Math.max(0, rows.length - 1);
  };

  const startDrag = (event: ReactPointerEvent, id: string) => {
    if (readonly || event.button !== 0) return;
    // A finger on the row is a scroll — the rows fill the width, and a list
    // that swallowed every swipe would leave nowhere to scroll the step from.
    // Only the grip, which says it can be taken hold of, starts a drag.
    if (isFinger(event.pointerType) && !isGrip(event.target)) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      id,
      grabX: event.clientX - box.left,
      grabY: event.clientY - box.top,
      fromX: event.clientX,
      fromY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      width: box.width,
      height: box.height,
      order,
      moved: false,
    };
    redraw();
  };

  const moveDrag = (event: Pick<PointerEvent, "clientX" | "clientY">) => {
    const current = dragRef.current;
    if (!current) return;

    const target = indexAt(event.clientY);
    dragRef.current = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      order: reorder(current.order, current.id, target),
      // Measured from where the drag began, not from the last position: a
      // slow drag moves a pixel at a time and would otherwise never count as
      // a drag at all.
      moved:
        current.moved ||
        Math.abs(event.clientX - current.fromX) > 3 ||
        Math.abs(event.clientY - current.fromY) > 3,
    };
    if (dragRef.current.moved) {
      autoScroll.follow(listRef.current, event.clientX, event.clientY);
    }
    redraw();
  };

  const endDrag = () => {
    autoScroll.stop();
    const current = dragRef.current;
    dragRef.current = null;
    redraw();
    if (!current || !current.moved) return;

    // Committed once, on release, rather than on every frame of the drag: the
    // answer is where the learner put the item down, not the path they took.
    if (current.order.join() !== order.join()) {
      onReorder(current.order);
      say(current.id, current.order);
    }
  };

  // The rows move under a pointer that holds still while the list scrolls,
  // so what it is over is measured again after every step of the scroll.
  const autoScroll = useAutoScroll(() => {
    const current = dragRef.current;
    if (current) moveDrag({ clientX: current.x, clientY: current.y });
  });

  usePointerDrag(moveDrag, endDrag);

  const lifted = drag?.moved ? itemById(drag.id) : undefined;

  return (
    <div className="bitflow-ordering">
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      <ol className="bitflow-ordering-list" ref={listRef}>
        {shown.map((id, index) => {
          const item = itemById(id);
          if (!item) return null;
          const right = correct?.includes(id);
          /* The one under the pointer leaves a hole the size it left, so the
             others move apart and the gap says where it will land. */
          const isGap = drag?.moved === true && drag.id === id;

          const classes = ["bitflow-ordering-item"];
          if (marked) {
            classes.push(
              right
                ? "bitflow-ordering-item-correct"
                : "bitflow-ordering-item-wrong",
            );
          }
          if (isGap) classes.push("bitflow-ordering-item-gap");

          return (
            <li key={id}>
              <button
                type="button"
                className={classes.join(" ")}
                disabled={readonly}
                style={isGap ? { height: `${drag.height}px` } : undefined}
                /*
                 * Its name, where it is, and how many there are — everything a
                 * reorder needs, and none of it visible to someone who cannot
                 * see the rows move.
                 */
                aria-label={t("itemLabel", {
                  item: nameOf(item),
                  position: index + 1,
                  total: shown.length,
                })}
                onPointerDown={(event) => startDrag(event, id)}
                onKeyDown={(event) => {
                  const delta =
                    event.key === "ArrowUp"
                      ? -1
                      : event.key === "ArrowDown"
                        ? 1
                        : 0;
                  if (delta === 0) return;
                  event.preventDefault();
                  moveTo(id, index + delta);
                }}
              >
                {!isGap && (
                  <>
                    {!readonly && <Grip />}
                    <span className="bitflow-ordering-position" aria-hidden="true">
                      {index + 1}
                    </span>
                    {renderContent(item)}
                  </>
                )}

                {marked && (
                  <span className="bitflow-visually-hidden">
                    {" "}
                    {t(right ? "itemRight" : "itemWrong")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {/*
        The item itself, following the cursor. Fixed to the viewport and
        deaf to the pointer, so it neither drifts with a scrolling ancestor
        nor gets in the way of the rows it is passing over.
      */}
      {lifted && drag && (
        <div
          className="bitflow-ordering-item bitflow-ordering-lifted"
          aria-hidden="true"
          style={
            {
              width: `${drag.width}px`,
              height: `${drag.height}px`,
              transform: `translate(${drag.x - drag.grabX}px, ${drag.y - drag.grabY}px)`,
            } as CSSProperties
          }
        >
          <Grip />
          <span className="bitflow-ordering-position">
            {drag.order.indexOf(drag.id) + 1}
          </span>
          {renderContent(lifted)}
        </div>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};

/** Where a finger takes hold of a row. Decoration to anything but a touch. */
const Grip = () => (
  <span className="bitflow-ordering-grip" aria-hidden="true" />
);

/** A touch or a pen: a pointer whose drag the browser would take for a scroll. */
const isFinger = (pointerType: string): boolean =>
  pointerType === "touch" || pointerType === "pen";

const isGrip = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest(".bitflow-ordering-grip") !== null;

const renderContent = (item: Item) =>
  item.kind === "image" && item.image?.src ? (
    <img
      className="bitflow-ordering-image"
      src={item.image.src}
      alt=""
      draggable={false}
    />
  ) : (
    <span className="bitflow-ordering-text">{item.label || item.id}</span>
  );

/** The list with one item taken out and put back at `to`. */
const reorder = (order: string[], id: string, to: number): string[] => {
  const from = order.indexOf(id);
  if (from === -1) return order;
  const next = [...order];
  next.splice(from, 1);
  next.splice(Math.min(Math.max(to, 0), order.length - 1), 0, id);
  return next;
};
