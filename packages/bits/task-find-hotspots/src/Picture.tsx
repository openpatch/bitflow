import { translate, type Locale } from "@bitflow/core";
import { useCallback, useRef, useState, type ReactElement } from "react";
import { hotspotAt } from "./geometry";
import { messages } from "./messages";
import type { Answer, Data, Hotspot } from "./schema";

/** How far one arrow-key press moves the aim; Shift makes it coarse. */
const STEP = 0.01;
const STEP_FAST = 0.05;

/**
 * The picture, and one choice to make on it.
 *
 * The regions are never drawn before the answer: the whole task is finding
 * where something is, and outlining the candidates answers it. That leaves the
 * usual problem — a picture cannot be searched by someone who cannot see it —
 * and here it has a clean answer. The learner aims at a point, and a keyboard
 * can move a point exactly as freely as a pointer can. So there is a crosshair
 * that the arrow keys move and Enter commits, revealing nothing that a mouse
 * user is not also working from.
 */
export const Picture = ({
  data,
  answer,
  chosen,
  locale,
  readonly,
  onAnswerChange,
}: {
  data: Data;
  answer?: Answer;
  /** The region the answer landed on, once it has been marked. */
  chosen?: { hotspotId?: string; missed?: boolean };
  locale: Locale;
  readonly?: boolean;
  onAnswerChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const imageRef = useRef<HTMLDivElement>(null);
  /** Where the crosshair is aiming, for whoever is not using a pointer. */
  const [aim, setAim] = useState({ x: 0.5, y: 0.5 });
  const [announcement, setAnnouncement] = useState("");

  const selection = answer?.selection;
  const marked = chosen !== undefined;

  const toFractions = useCallback((clientX: number, clientY: number) => {
    const box = imageRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return null;
    return {
      x: Math.min(1, Math.max(0, (clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (clientY - box.top) / box.height)),
    };
  }, []);

  const choose = (point: { x: number; y: number }) => {
    if (readonly) return;
    const hotspot = hotspotAt(data.hotspots, point);
    onAnswerChange({ selection: { ...point, hotspotId: hotspot?.id } });
    // Says a choice was made and where, never whether it was right: that is
    // what checking is for, and a mouse user is told no sooner.
    setAnnouncement(
      t("chose", {
        x: Math.round(point.x * 100),
        y: Math.round(point.y * 100),
      }),
    );
  };

  const nameOf = (hotspot: Hotspot) => hotspot.label || hotspot.id;
  const chosenHotspot = data.hotspots.find(
    (hotspot) => hotspot.id === chosen?.hotspotId,
  );

  return (
    <div className="bitflow-hotspots">
      <div
        className="bitflow-hotspots-picture"
        ref={imageRef}
        style={{ aspectRatio: `${data.size.width} / ${data.size.height}` }}
      >
        {data.background.src ? (
          <img
            className="bitflow-hotspots-image"
            src={data.background.src}
            alt={data.background.alt}
            draggable={false}
          />
        ) : (
          <div className="bitflow-hotspots-image bitflow-hotspots-noimage" />
        )}

        {/*
          One control over the whole picture. A button rather than a bare click
          handler, so it is in the tab order and announces itself; the aim it
          carries is what the arrow keys move.
        */}
        <button
          type="button"
          className="bitflow-hotspots-surface"
          disabled={readonly}
          aria-label={t("pictureLabel", {
            alt: data.background.alt,
            x: Math.round(aim.x * 100),
            y: Math.round(aim.y * 100),
          })}
          onClick={(event) => {
            /*
             * `detail` counts the clicks behind the event, and is 0 when the
             * button was activated from the keyboard. Such an event still
             * carries coordinates — zeros — so the position has to come from
             * the crosshair instead, or Enter would always answer the top-left
             * corner.
             */
            const at =
              event.detail === 0
                ? aim
                : toFractions(event.clientX, event.clientY);
            if (!at) return;
            setAim(at);
            choose(at);
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? STEP_FAST : STEP;
            const deltas: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            };
            const delta = deltas[event.key];
            if (!delta) return;
            event.preventDefault();
            const next = {
              x: Math.min(1, Math.max(0, aim.x + delta[0])),
              y: Math.min(1, Math.max(0, aim.y + delta[1])),
            };
            setAim(next);
            setAnnouncement(
              t("aiming", {
                x: Math.round(next.x * 100),
                y: Math.round(next.y * 100),
              }),
            );
          }}
        />

        {/* Where the learner is aiming, for a keyboard. Shown only while the
            surface has focus, so a pointer user never sees a stray cross. */}
        <span
          className="bitflow-hotspots-aim"
          style={{ left: `${aim.x * 100}%`, top: `${aim.y * 100}%` }}
          aria-hidden="true"
        />

        {/* The answer, once given. */}
        {selection && (
          <span
            className={
              marked
                ? `bitflow-hotspots-mark bitflow-hotspots-mark-${chosen?.hotspotId && chosenHotspot?.correct ? "correct" : "wrong"}`
                : "bitflow-hotspots-mark"
            }
            style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%` }}
            aria-hidden="true"
          />
        )}

        {/* After marking, the region that was chosen — so the learner can see
            what they actually hit, which a bare cross does not tell them. */}
        {marked && chosenHotspot && (
          <span
            className={
              chosenHotspot.correct
                ? "bitflow-hotspots-region bitflow-hotspots-region-correct"
                : "bitflow-hotspots-region bitflow-hotspots-region-wrong"
            }
            style={{
              left: `${chosenHotspot.x * 100}%`,
              top: `${chosenHotspot.y * 100}%`,
              width: `${chosenHotspot.width * 100}%`,
              height: `${chosenHotspot.height * 100}%`,
              borderRadius: chosenHotspot.shape === "ellipse" ? "50%" : undefined,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      {marked && (
        <p className="bitflow-hotspots-verdict">
          {chosenHotspot
            ? t("landedOn", { region: nameOf(chosenHotspot) })
            : t("landedNowhere")}
        </p>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
