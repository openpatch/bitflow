import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { messages } from "./messages";
import type { Item } from "./schema";

/**
 * The items, in the order the learner has them.
 *
 * Reordering is the same two decisions however it is done — take this one,
 * put it there — so the pointer and the keyboard share the one operation.
 * Dragging moves an item as the pointer crosses its neighbours; the arrow keys
 * move the focused item one place at a time. Neither is a fallback for the
 * other, and both announce where the item has ended up, because a list that
 * silently rearranges itself is unusable without sight.
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
  /** The id being dragged, in a ref so a fast gesture cannot outrun a render. */
  const dragRef = useRef<string | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);

  const itemById = (id: string) => items.find((item) => item.id === id);
  const nameOf = (item: Item) => item.label || item.id;
  const marked = correct !== undefined;

  /** Moves one item to a new index and says where it landed. */
  const moveTo = (id: string, to: number) => {
    if (readonly) return;
    const from = order.indexOf(id);
    const target = Math.min(Math.max(to, 0), order.length - 1);
    if (from === -1 || from === target) return;

    const next = [...order];
    next.splice(from, 1);
    next.splice(target, 0, id);
    onReorder(next);

    const item = itemById(id);
    setAnnouncement(
      t("moved", {
        item: item ? nameOf(item) : id,
        position: target + 1,
        total: order.length,
      }),
    );
  };

  /**
   * While dragging, the item under the pointer takes the dragged item's place.
   *
   * Measured against each row's middle rather than its edges, so an item swaps
   * once the pointer is genuinely past its neighbour rather than jittering
   * back and forth on the boundary.
   */
  const dragOver = (event: PointerEvent | ReactPointerEvent) => {
    const id = dragRef.current;
    if (!id || !listRef.current) return;

    const rows = [...listRef.current.querySelectorAll("li")];
    const target = rows.findIndex((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    moveTo(id, target === -1 ? rows.length - 1 : target);
  };

  const endDrag = () => {
    dragRef.current = null;
    redraw();
  };

  usePointerDrag(dragOver, endDrag);

  return (
    <div className="bitflow-ordering">
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      <ol className="bitflow-ordering-list" ref={listRef}>
        {order.map((id, index) => {
          const item = itemById(id);
          if (!item) return null;
          const right = correct?.includes(id);
          const dragging = dragRef.current === id;

          const classes = ["bitflow-ordering-item"];
          if (marked) {
            classes.push(
              right
                ? "bitflow-ordering-item-correct"
                : "bitflow-ordering-item-wrong",
            );
          }
          if (dragging) classes.push("bitflow-ordering-item-dragging");

          return (
            <li key={id}>
              <button
                type="button"
                className={classes.join(" ")}
                disabled={readonly}
                /*
                 * Its name, where it is, and how many there are — everything a
                 * reorder needs and none of it visible in a bare list to
                 * someone who cannot see the rows move.
                 */
                aria-label={t("itemLabel", {
                  item: nameOf(item),
                  position: index + 1,
                  total: order.length,
                })}
                onPointerDown={(event) => {
                  if (readonly || event.button !== 0) return;
                  dragRef.current = id;
                  redraw();
                }}
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
                <span className="bitflow-ordering-position" aria-hidden="true">
                  {index + 1}
                </span>

                {item.kind === "image" && item.image?.src ? (
                  <img
                    className="bitflow-ordering-image"
                    src={item.image.src}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <span className="bitflow-ordering-text">{nameOf(item)}</span>
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

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
