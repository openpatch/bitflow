import { translate, type Locale } from "@bitflow/core";
import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { RoundOutcome } from "./evaluate";
import { messages } from "./messages";
import type { Answer, Data, Round, Target } from "./schema";

/**
 * The play area: one target at a time, and a click for each.
 *
 * The task measures pointing, so nothing here pretends otherwise. What it says
 * before it starts is what it needs — a mouse, a trackpad or a touchscreen —
 * and, when the author allows it, the learner can stand down instead. That is
 * not a fallback interaction bolted on to satisfy a checklist; a keyboard
 * route to the targets would measure nothing at all, and offering one would
 * only disguise which question is being asked.
 */
export const Arena = ({
  data,
  answer,
  outcomes,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  /** Per-round marks, once the answer has been checked. */
  outcomes?: RoundOutcome[];
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const areaRef = useRef<HTMLDivElement>(null);
  /** When the current target appeared, on the monotonic clock. */
  const shownAt = useRef<number>(0);
  const [started, setStarted] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const rounds = answer.rounds;
  const done = rounds.length >= data.targets.length;
  const current: Target | undefined = data.targets[rounds.length];
  const finished = readonly || answer.optedOut || done;

  const begin = () => {
    setStarted(true);
    shownAt.current = performance.now();
    setAnnouncement(t("started", { total: data.targets.length }));
  };

  const standDown = () => {
    onChange({ rounds: [], optedOut: true });
    setAnnouncement(t("stoodDown"));
  };

  const click = (event: ReactPointerEvent) => {
    if (finished || !started || !current) return;
    const box = areaRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;

    /*
     * Where the click landed inside this task's own area, as a fraction of
     * it — never the screen or window position. The task is measuring
     * someone's aim, not their hardware or where their window happens to be.
     */
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;

    const radiusX = current.radius * Math.min(1, data.aspectRatio);
    const radiusY = radiusX / data.aspectRatio;
    const hit =
      ((x - current.x) / radiusX) ** 2 + ((y - current.y) / radiusY) ** 2 <= 1;

    const now = performance.now();
    const round: Round = {
      targetId: current.id,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      hit,
      // Monotonic, so a clock change mid-task cannot produce a negative time.
      ms: Math.max(0, Math.round(now - shownAt.current)),
    };
    shownAt.current = now;

    onChange({ ...answer, rounds: [...rounds, round] });
    setAnnouncement(
      t(hit ? "roundHit" : "roundMiss", {
        round: rounds.length + 1,
        total: data.targets.length,
        ms: round.ms,
      }),
    );
  };

  if (answer.optedOut) {
    return (
      <div className="bitflow-mouse">
        <p className="bitflow-hint">{t("stoodDownNotice")}</p>
      </div>
    );
  }

  const area = (children: ReactElement | ReactElement[] | null) => (
    <div
      ref={areaRef}
      className="bitflow-mouse-area"
      style={{ aspectRatio: `1 / ${data.aspectRatio}` }}
      onPointerDown={click}
    >
      {children}
    </div>
  );

  if (!started && !finished) {
    return (
      <div className="bitflow-mouse">
        {/* Said before starting, not discovered by someone who cannot do it. */}
        <p className="bitflow-hint">
          {t("needsPointer")} {t("howTo", { total: data.targets.length })}
        </p>
        <div className="bitflow-row">
          <button type="button" className="bitflow-button" onClick={begin}>
            {t("start")}
          </button>
          {data.allowOptOut && (
            <button
              type="button"
              className="bitflow-button bitflow-button-secondary"
              onClick={standDown}
            >
              {t("optOut")}
            </button>
          )}
        </div>
        {data.allowOptOut && <p className="bitflow-hint">{t("optOutHint")}</p>}
      </div>
    );
  }

  return (
    <div className="bitflow-mouse">
      <p className="bitflow-hint">
        {finished
          ? t("allDone", { total: data.targets.length })
          : t("progress", { round: rounds.length + 1, total: data.targets.length })}
      </p>

      {area(
        <>
          {/* The target to hit now. Only ever one: the task is a sequence of
              single moves, and two targets would be a different question. */}
          {!finished && current && (
            <span
              className="bitflow-mouse-target"
              style={targetStyle(current, data)}
              aria-hidden="true"
            />
          )}

          {/* Where each click landed, once the answer is in. Shown because
              the pattern of the misses is the thing worth looking at. */}
          {finished &&
            outcomes &&
            rounds.map((round, index) => (
              <span
                key={`${round.targetId}-${index}`}
                className={
                  round.hit
                    ? "bitflow-mouse-mark bitflow-mouse-mark-hit"
                    : "bitflow-mouse-mark bitflow-mouse-mark-miss"
                }
                style={{ left: `${round.x * 100}%`, top: `${round.y * 100}%` }}
                aria-hidden="true"
              />
            ))}
          {finished &&
            outcomes &&
            data.targets.map((target) => (
              <span
                key={target.id}
                className="bitflow-mouse-target bitflow-mouse-target-past"
                style={targetStyle(target, data)}
                aria-hidden="true"
              />
            ))}
        </>,
      )}

      {finished && outcomes && (
        <table className="bitflow-mouse-rounds">
          <caption className="bitflow-visually-hidden">{t("roundsCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("colRound")}</th>
              <th scope="col">{t("colResult")}</th>
              <th scope="col">{t("colTime")}</th>
              <th scope="col">{t("colDifficulty")}</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((mark, index) => (
              <tr key={`${mark.targetId}-${index}`}>
                <td>{index + 1}</td>
                <td>{mark.hit ? t("hit") : t("miss")}</td>
                <td>{t("ms", { ms: mark.ms })}</td>
                <td>{mark.difficulty.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};

/** A circle at the right place and size, whatever shape the area ends up. */
const targetStyle = (target: Target, data: Data) => {
  const radiusX = target.radius * Math.min(1, data.aspectRatio);
  return {
    left: `${target.x * 100}%`,
    top: `${target.y * 100}%`,
    width: `${radiusX * 200}%`,
    // Held square by the area's own aspect ratio rather than by a second
    // percentage, which would be of the height and so a different size.
    aspectRatio: "1",
  };
};
