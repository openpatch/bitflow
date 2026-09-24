import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import { useCallback, useRef, useState, type ReactElement } from "react";
import { boxOf, regionBox } from "./geometry";
import { messages } from "./messages";
import type { Annotation, Answer, Data, RegionOutcome } from "./schema";

/** How far one arrow-key press moves the aim; Shift makes it coarse. */
const STEP = 0.01;
const STEP_FAST = 0.05;

/** How far a pointer has to travel before it is a box and not a click. */
const DRAG_THRESHOLD = 0.02;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

let counter = 0;
const newId = () => `mark-${(counter += 1)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * The picture, and the marks the learner puts on it.
 *
 * Placing a mark is one decision — where — and a keyboard makes it exactly as
 * well as a pointer does, so there is no fallback here and no lesser path. A
 * crosshair the arrow keys move, Enter to place; for a box, Enter once for the
 * first corner and again for the opposite one, which is the two decisions a
 * drag makes, made one at a time.
 *
 * The accepted regions are never drawn until the answer is in. Outlining them
 * would answer the question, and doing it only for a screen reader would
 * answer it for some people and not others.
 */
export const Canvas = ({
  data,
  answer,
  outcomes,
  locale,
  readonly,
  onAnswerChange,
}: {
  data: Data;
  answer?: Answer;
  /**
   * Present once marked; the regions are drawn and the marks are judged. A
   * mark no outcome names is a mark that answered nothing, so the strays are
   * read off this rather than passed in beside it — two lists of the same
   * thing can disagree.
   */
  outcomes?: RegionOutcome[];
  locale: Locale;
  readonly?: boolean;
  onAnswerChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const pictureRef = useRef<HTMLDivElement>(null);
  const [aim, setAim] = useState({ x: 0.5, y: 0.5 });
  /** The first corner, while a box is being placed from the keyboard. */
  const [corner, setCorner] = useState<{ x: number; y: number } | undefined>();
  const [announcement, setAnnouncement] = useState("");
  /** Where a pointer drag began, so distance is measured from the start. */
  const drag = useRef<{ fromX: number; fromY: number } | undefined>(undefined);
  /** Swallows the click that follows a drag, which would place a second mark. */
  const dragged = useRef(false);
  const [drawing, setDrawing] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >();

  const marks = answer?.annotations ?? [];
  const marked = outcomes !== undefined;
  const full = marks.length >= data.maximumCount;

  const toFractions = useCallback((clientX: number, clientY: number) => {
    const box = pictureRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return null;
    return {
      x: clamp((clientX - box.left) / box.width),
      y: clamp((clientY - box.top) / box.height),
    };
  }, []);

  const place = (mark: Omit<Annotation, "id">) => {
    if (readonly || full) return;
    const added: Annotation = { ...mark, id: newId() };
    onAnswerChange({ annotations: [...marks, added] });
    setAnnouncement(
      t("placed", {
        number: marks.length + 1,
        x: Math.round(mark.x * 100),
        y: Math.round(mark.y * 100),
      }),
    );
  };

  const remove = (id: string) => {
    if (readonly) return;
    const index = marks.findIndex((mark) => mark.id === id);
    onAnswerChange({ annotations: marks.filter((mark) => mark.id !== id) });
    setAnnouncement(t("removed", { number: index + 1 }));
  };

  const rename = (id: string, label: string) =>
    onAnswerChange({
      annotations: marks.map((mark) =>
        mark.id === id ? { ...mark, label } : mark,
      ),
    });

  /** A point, or a box between two corners. */
  const placeAt = (from: { x: number; y: number }, to?: { x: number; y: number }) => {
    if (data.annotationKind === "point" || !to) {
      place({ kind: "point", x: from.x, y: from.y, width: 0, height: 0, label: "" });
      return;
    }
    place({
      kind: "rect",
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
      label: "",
    });
  };

  usePointerDrag(
    (event) => {
      if (!drag.current) return;
      const at = toFractions(event.clientX, event.clientY);
      if (!at) return;
      const { fromX, fromY } = drag.current;
      // Measured from where the drag began, never from the last event: a slow
      // drag moves a pixel at a time and would never pass the threshold.
      if (Math.hypot(at.x - fromX, at.y - fromY) > DRAG_THRESHOLD) {
        dragged.current = true;
      }
      if (dragged.current && data.annotationKind === "rect") {
        setDrawing({
          x: Math.min(fromX, at.x),
          y: Math.min(fromY, at.y),
          width: Math.abs(at.x - fromX),
          height: Math.abs(at.y - fromY),
        });
      }
    },
    (event) => {
      const start = drag.current;
      drag.current = undefined;
      setDrawing(undefined);
      if (!start || !dragged.current) return;
      const at = toFractions(event.clientX, event.clientY);
      if (at && data.annotationKind === "rect") {
        placeAt({ x: start.fromX, y: start.fromY }, at);
      }
    },
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (readonly) return;
    const step = event.shiftKey ? STEP_FAST : STEP;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setAim((current) => ({
        x: clamp(current.x + move[0]),
        y: clamp(current.y + move[1]),
      }));
      return;
    }
    if (event.key === "Escape" && corner) {
      event.preventDefault();
      setCorner(undefined);
      setAnnouncement(t("cornerCancelled"));
    }
  };

  const commit = () => {
    if (data.annotationKind === "point") {
      placeAt(aim);
      return;
    }
    if (!corner) {
      setCorner(aim);
      setAnnouncement(
        t("cornerSet", { x: Math.round(aim.x * 100), y: Math.round(aim.y * 100) }),
      );
      return;
    }
    placeAt(corner, aim);
    setCorner(undefined);
  };

  const outcomeFor = (id: string) =>
    outcomes?.find((outcome) => outcome.annotationId === id);

  return (
    <div className="bitflow-annotate">
      <div
        // A point mark is a tap, so the picture leaves a swipe to the browser
        // to scroll the step with. A `rect` mark is drawn with a drag, which a
        // browser cannot tell from a scroll gesture on its own, so only that
        // mode opts the picture out of scrolling.
        className={
          data.annotationKind === "rect"
            ? "bitflow-annotate-picture bitflow-annotate-picture-drag"
            : "bitflow-annotate-picture"
        }
        ref={pictureRef}
        style={{ aspectRatio: `${data.size.width} / ${data.size.height}` }}
      >
        {data.background.src ? (
          <img
            className="bitflow-annotate-image"
            src={data.background.src}
            alt={data.background.alt}
            draggable={false}
          />
        ) : (
          <div className="bitflow-annotate-image bitflow-annotate-noimage" />
        )}

        {/* Drawn only once the answer is in: an outline beforehand answers the
            question, and one drawn for some people and not others answers it
            unevenly. */}
        {marked &&
          data.regions.map((region) => {
            const box = regionBox(region);
            return (
              <span
                key={region.id}
                className="bitflow-annotate-region"
                aria-hidden="true"
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                  borderRadius: region.kind === "circle" ? "50%" : undefined,
                }}
              />
            );
          })}

        {marks.map((mark, index) => {
          const box = boxOf(mark);
          const outcome = outcomeFor(mark.id);
          const state = !marked
            ? ""
            : outcome && !outcome.labelWrong
              ? " bitflow-annotate-mark-right"
              : outcome
                ? " bitflow-annotate-mark-named-wrong"
                : " bitflow-annotate-mark-stray";
          return (
            <span
              key={mark.id}
              className={`bitflow-annotate-mark bitflow-annotate-mark-${mark.kind}${state}`}
              aria-hidden="true"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: mark.kind === "rect" ? `${box.width * 100}%` : undefined,
                height: mark.kind === "rect" ? `${box.height * 100}%` : undefined,
              }}
            >
              <span className="bitflow-annotate-number">{index + 1}</span>
            </span>
          );
        })}

        {drawing && (
          <span
            className="bitflow-annotate-mark bitflow-annotate-mark-rect bitflow-annotate-drawing"
            aria-hidden="true"
            style={{
              left: `${drawing.x * 100}%`,
              top: `${drawing.y * 100}%`,
              width: `${drawing.width * 100}%`,
              height: `${drawing.height * 100}%`,
            }}
          />
        )}

        {/*
          One control over the whole picture. A button rather than a bare click
          handler, so it is in the tab order and announces itself; the aim it
          carries is what the arrow keys move.
        */}
        <button
          type="button"
          className="bitflow-annotate-surface"
          disabled={readonly || full}
          aria-label={t(
            data.annotationKind === "rect"
              ? corner
                ? "surfaceCorner"
                : "surfaceRect"
              : "surfacePoint",
            {
              alt: data.background.alt,
              x: Math.round(aim.x * 100),
              y: Math.round(aim.y * 100),
              placed: marks.length,
              total: data.maximumCount,
            },
          )}
          onKeyDown={onKeyDown}
          onPointerDown={(event) => {
            if (readonly || full) return;
            const at = toFractions(event.clientX, event.clientY);
            if (!at) return;
            dragged.current = false;
            drag.current = { fromX: at.x, fromY: at.y };
          }}
          onClick={(event) => {
            // A drag has already placed its box; the click that follows it
            // would place a second mark on top.
            if (dragged.current) {
              dragged.current = false;
              return;
            }
            /*
             * `detail` counts the clicks behind the event and is 0 when the
             * button was activated from the keyboard. Such an event still
             * carries coordinates — zeros — so the position has to come from
             * the crosshair, or Enter would always mark the top-left corner.
             */
            if (event.detail === 0) {
              commit();
              return;
            }
            const at = toFractions(event.clientX, event.clientY);
            if (at) placeAt(at);
          }}
        />

        {/* After the surface, because it is shown by a sibling selector on the
            surface's own focus: a pointer user has a cursor already, and a
            second cross would be a distraction. */}
        {!readonly && (
          <span
            className="bitflow-annotate-aim"
            aria-hidden="true"
            style={{ left: `${aim.x * 100}%`, top: `${aim.y * 100}%` }}
          />
        )}
      </div>

      {/*
        Every mark as a row: where it is, what it is called, and a way to take
        it off. This is not a courtesy for screen readers — it is the only way
        anybody removes or renames a mark, and it is how the answer reads back
        as words rather than as a picture.
      */}
      <ul className="bitflow-annotate-list">
        {marks.length === 0 && (
          <li className="bitflow-text-muted">{t("nothingPlaced")}</li>
        )}
        {marks.map((mark, index) => {
          const outcome = outcomeFor(mark.id);
          return (
            <li key={mark.id} className="bitflow-annotate-row">
              <span className="bitflow-annotate-row-where">
                {t(mark.kind === "rect" ? "markBox" : "markPoint", {
                  number: index + 1,
                  x: Math.round(mark.x * 100),
                  y: Math.round(mark.y * 100),
                  width: Math.round(mark.width * 100),
                  height: Math.round(mark.height * 100),
                })}
              </span>

              {data.requireLabel && (
                <input
                  type="text"
                  className="bitflow-input"
                  value={mark.label}
                  disabled={readonly}
                  placeholder={t("namePlaceholder")}
                  aria-label={t("nameOf", { number: index + 1 })}
                  onChange={(event) => rename(mark.id, event.target.value)}
                />
              )}

              {marked && (
                <span className="bitflow-annotate-verdict">
                  {outcome
                    ? outcome.labelWrong
                      ? t("verdictNamedWrong", { label: outcome.label })
                      : t("verdictRight", { label: outcome.label })
                    : t("verdictStray")}
                </span>
              )}

              {!readonly && (
                <button
                  type="button"
                  className="bitflow-button bitflow-button-quiet"
                  onClick={() => remove(mark.id)}
                >
                  {t("removeMark", { number: index + 1 })}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Once marked, what was missed — named, since the picture cannot say it
          to everybody. */}
      {marked && (
        <ul className="bitflow-annotate-missed">
          {outcomes
            .filter((outcome) => !outcome.annotationId)
            .map((outcome) => (
              <li key={outcome.regionId} className="bitflow-text-muted">
                {t("missed", { label: outcome.label })}
              </li>
            ))}
        </ul>
      )}

      <span className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </span>
      {!readonly && (
        <p className="bitflow-hint">
          {t(data.annotationKind === "rect" ? "helpRect" : "helpPoint")}
        </p>
      )}
    </div>
  );
};
