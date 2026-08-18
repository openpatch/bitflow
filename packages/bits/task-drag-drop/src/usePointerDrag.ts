import { useEffect, useRef } from "react";

/**
 * Follows a pointer for the length of a drag, listening on the window.
 *
 * Not on the element and not through `setPointerCapture`: the pointer leaves
 * the thing being dragged all the time, capture is lost when React replaces a
 * node mid-gesture, and a release outside the window never arrives at all.
 * Each of those ends a drag halfway, leaving whatever was moving stuck to the
 * cursor. The window sees every one of them.
 *
 * Subscribed for as long as the component is mounted, not only while a drag
 * runs: subscribing when one starts means waiting for a render, and a quick
 * gesture is over before that happens. The handlers do nothing when there is
 * no drag, and they are held in refs so the listeners are attached once
 * rather than on every frame of one.
 */
export const usePointerDrag = (
  onMove: (event: PointerEvent) => void,
  onEnd: (event: PointerEvent) => void,
): void => {
  const move = useRef(onMove);
  const end = useRef(onEnd);
  move.current = onMove;
  end.current = onEnd;

  useEffect(() => {
    const handleMove = (event: PointerEvent) => move.current(event);
    const handleEnd = (event: PointerEvent) => end.current(event);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    // A cancelled pointer — the browser taking over for a scroll, a pen
    // leaving range — is an ending too, and a silent one if ignored.
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, []);
};
