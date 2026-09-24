import { useEffect, useRef } from "react";

/** How close to an edge, in pixels, the pointer has to be to start a scroll. */
const EDGE = 48;
/** The fastest a scroll goes, in pixels a frame, with the pointer on the edge. */
const SPEED = 14;

/** The ancestors that scroll vertically, nearest first, ending with the page. */
const scrollersOf = (element: Element | null): (Element | null)[] => {
  const found: (Element | null)[] = [];
  for (let at = element?.parentElement; at; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      at.scrollHeight > at.clientHeight
    ) {
      found.push(at);
    }
  }
  // `null` stands for the page itself, which scrolls through the window.
  found.push(null);
  return found;
};

/** How far to scroll this frame: negative up, positive down, zero not at all. */
const stepFor = (y: number, top: number, bottom: number): number => {
  if (y < top + EDGE) return -SPEED * Math.min(1, (top + EDGE - y) / EDGE);
  if (y > bottom - EDGE) return SPEED * Math.min(1, (y - (bottom - EDGE)) / EDGE);
  return 0;
};

/**
 * Scrolls whatever is under a drag when the pointer is held near its edge.
 *
 * A step scrolls inside its flow, and the flow often inside a page — so a
 * list longer than the box it sits in has places a line cannot be dragged to,
 * because nothing moves them into view. With a mouse the wheel still works
 * mid-drag; with a finger on a grip that has `touch-action: none` there is no
 * other way to get there at all.
 *
 * The nearest scroller that still has room in that direction takes the
 * scroll, then the next one out, and the page last. Each frame it scrolls,
 * `onScroll` runs, so the drag can re-measure what is under a pointer that has
 * not moved while the rows went past it.
 */
export const useAutoScroll = (
  onScroll: () => void,
): {
  /** The pointer is at (x, y), dragging something inside `element`. */
  follow: (element: Element | null, x: number, y: number) => void;
  /** The drag is over. */
  stop: () => void;
} => {
  const callback = useRef(onScroll);
  // The latest callback, kept for the next frame without re-subscribing.
  useEffect(() => {
    callback.current = onScroll;
  });
  const state = useRef<{ element: Element | null; y: number } | null>(null);
  const frame = useRef<number | null>(null);

  const tick = () => {
    frame.current = null;
    const current = state.current;
    if (!current) return;

    for (const scroller of scrollersOf(current.element)) {
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const bottom = scroller
        ? scroller.getBoundingClientRect().bottom
        : window.innerHeight;
      const step = stepFor(current.y, top, bottom);
      if (step === 0) continue;

      const before = scroller ? scroller.scrollTop : window.scrollY;
      if (scroller) scroller.scrollTop = before + step;
      else window.scrollBy(0, step);
      const after = scroller ? scroller.scrollTop : window.scrollY;
      // At the end of its travel: let the next one out have a go.
      if (after === before) continue;

      callback.current();
      frame.current = requestAnimationFrame(tick);
      return;
    }
  };

  const stop = () => {
    state.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const follow = (element: Element | null, _x: number, y: number) => {
    state.current = { element, y };
    if (frame.current === null && typeof requestAnimationFrame === "function") {
      frame.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => stop, []);

  return { follow, stop };
};
