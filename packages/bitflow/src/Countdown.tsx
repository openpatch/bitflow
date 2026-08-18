import { formatDuration, translate, type Locale } from "@bitflow/core";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { messages } from "./messages";

/**
 * A ticking clock that calls `onExpire` once.
 *
 * `remaining` is recomputed from the attempt rather than counted down from a
 * stored number, so a reload, a pause, or a slow tab cannot drift it — the
 * snapshot is the clock, and this only reads it every second.
 */
export const Countdown = ({
  remaining,
  label,
  locale,
  onExpire,
}: {
  /** Milliseconds left, as of now. */
  remaining: () => number;
  label: string;
  locale: Locale;
  onExpire: () => void;
}): ReactElement | null => {
  const [left, setLeft] = useState(() => remaining());

  // Fired at most once per countdown: expiry moves the learner on, and a second
  // call would move them on twice.
  const expired = useRef(false);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    const tick = () => {
      const next = remaining();
      setLeft(next);
      if (next <= 0 && !expired.current) {
        expired.current = true;
        expire.current();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const seconds = Math.max(0, Math.ceil(left / 1000));
  // The last half-minute is when it starts to matter.
  const urgent = seconds <= 30;

  return (
    <div
      className={urgent ? "bitflow-countdown bitflow-countdown-urgent" : "bitflow-countdown"}
    >
      <span className="bitflow-countdown-label">{label}</span>{" "}
      <span
        className="bitflow-countdown-value"
        // Announced only in the closing seconds. A clock that speaks every
        // second makes a screen reader unusable.
        role={urgent ? "status" : undefined}
        aria-live={urgent ? "polite" : "off"}
      >
        {formatDuration(seconds * 1000)}
      </span>
      <span className="bitflow-visually-hidden">
        {translate(messages, "timeLeft", locale, {
          duration: formatDuration(seconds * 1000),
        })}
      </span>
    </div>
  );
};
