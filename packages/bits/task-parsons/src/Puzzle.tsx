import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { LineOutcome } from "./evaluate";
import { messages } from "./messages";
import type { Data, Line, PlacedLine } from "./schema";

/** How far one indentation step is drawn. */
const STEP_REM = 1.5;

/** Whether a point is inside an element, for hit-testing a drop. */
const within = (element: HTMLElement | null, x: number, y: number): boolean => {
  if (!element) return false;
  const box = element.getBoundingClientRect();
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
};

/** A line under the pointer, and what the puzzle would look like if dropped. */
type Drag = {
  lineId: string;
  /** Whether it was picked up from the bank or from the program. */
  fromBank: boolean;
  /** Where inside the line the pointer took hold, so it does not jump. */
  grabX: number;
  grabY: number;
  /** Where the drag began, which is what tells a drag from a click. */
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * The program as it would be if released now. A line dragged out over the
   * bank is simply absent from it — which is what makes dragging one out of
   * the program work without a second mechanism.
   */
  order: PlacedLine[];
  /** Whether the pointer is over the bank, where releasing sends it back. */
  overBank: boolean;
  moved: boolean;
};

/**
 * A bank of lines and the program being built from them.
 *
 * Two lists rather than one, because a Parsons problem turns on deciding what
 * is *not* part of the answer: a distractor has to be left behind, and there
 * has to be somewhere to leave it.
 *
 * Dragging carries a line between the lists and sets its indentation on the
 * way — how far right it is dropped is how far it is indented, which is the
 * gesture js-parsons established and the one the nesting actually looks like.
 * Every one of those is also a keystroke, because a programming exercise that
 * can only be done with a mouse is a programming exercise some people cannot
 * do: choosing a line adds it, the arrow keys move and indent it, and
 * Backspace puts it back.
 */
export const Puzzle = ({
  data,
  placed,
  outcomes,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  placed: PlacedLine[];
  /** Per-line marks, once the answer has been checked. */
  outcomes?: LineOutcome[];
  locale: Locale;
  readonly?: boolean;
  onChange: (lines: PlacedLine[]) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const [announcement, setAnnouncement] = useState("");
  const bankRef = useRef<HTMLElement>(null);
  const programRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const dragRef = useRef<Drag | null>(null);
  /**
   * Set when a drag actually moved, and cleared by the `click` that follows
   * it. Without this every drag would also count as a click on the line, and
   * a line dragged into place would be taken straight back out again.
   */
  const dragged = useRef(false);
  const [, redraw] = useReducer((count: number) => count + 1, 0);

  const drag = dragRef.current;
  /** The program as it stands, or as the drag would leave it. */
  const shown = drag?.moved ? drag.order : placed;

  const lineById = (id: string): Line | undefined =>
    data.lines.find((line) => line.id === id);
  const codeOf = (id: string) => lineById(id)?.text ?? id;

  const used = new Set(shown.map((entry) => entry.lineId));
  const bank = data.lines.filter((line) => !used.has(line.id));

  const add = (line: Line) => {
    if (readonly || dragged.current) {
      dragged.current = false;
      return;
    }
    // Appended rather than inserted: there is nowhere else obvious to put it,
    // and moving it afterwards is one keystroke.
    const next = [...placed, { lineId: line.id, indent: 0 }];
    onChange(next);
    setAnnouncement(t("added", { code: line.text, position: next.length }));
  };

  const remove = (index: number) => {
    if (readonly) return;
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    const entry = placed[index];
    onChange(placed.filter((_, i) => i !== index));
    setAnnouncement(t("removed", { code: codeOf(entry.lineId) }));
  };

  const move = (index: number, delta: number) => {
    if (readonly) return;
    const to = index + delta;
    if (to < 0 || to >= placed.length) return;
    const next = [...placed];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
    setAnnouncement(
      t("movedTo", { code: codeOf(placed[index].lineId), position: to + 1 }),
    );
  };

  const indent = (index: number, delta: number) => {
    if (readonly || !data.indentationMatters) return;
    const entry = placed[index];
    const next = Math.max(0, entry.indent + delta);
    if (next === entry.indent) return;
    onChange(
      placed.map((line, i) => (i === index ? { ...line, indent: next } : line)),
    );
    setAnnouncement(
      t("indentedTo", { code: codeOf(entry.lineId), indent: next }),
    );
  };

  // --- dragging -------------------------------------------------------------

  /** One indentation step, in pixels, from whatever the root font size is. */
  const stepPixels = () =>
    STEP_REM *
    parseFloat(getComputedStyle(document.documentElement).fontSize || "16");

  const startDrag = (
    event: ReactPointerEvent,
    lineId: string,
    fromBank: boolean,
  ) => {
    if (readonly || event.button !== 0) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      lineId,
      fromBank,
      grabX: event.clientX - box.left,
      grabY: event.clientY - box.top,
      fromX: event.clientX,
      fromY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      width: box.width,
      height: box.height,
      order: placed,
      overBank: fromBank,
      moved: false,
    };
    redraw();
  };

  const moveDrag = (event: PointerEvent | ReactPointerEvent) => {
    const current = dragRef.current;
    if (!current) return;

    /*
     * The bank is the only thing that takes a line back — not "anywhere
     * outside the program". Letting go a little below the last row is a near
     * miss, not a decision to discard the line, and losing it there is the
     * kind of surprise that stops people dragging at all.
     */
    const overBank = within(bankRef.current, event.clientX, event.clientY);

    const without = current.order.filter(
      (entry) => entry.lineId !== current.lineId,
    );

    let order = without;
    if (!overBank) {
      const rows = [...(programRef.current?.querySelectorAll("li") ?? [])].filter(
        (row) =>
          row.querySelector(".bitflow-parsons-line")?.getAttribute("data-line") !==
          current.lineId,
      );
      let target = rows.length;
      for (let i = 0; i < rows.length; i++) {
        const box = rows[i].getBoundingClientRect();
        if (event.clientY < box.top + box.height / 2) {
          target = i;
          break;
        }
      }

      /*
       * How far right the line is dropped is how far it is indented. The
       * measurement is of the line's own left edge, not the pointer, so where
       * it was taken hold of does not change where it lands.
       */
      const left = event.clientX - current.grabX;
      // Measured against the list rather than the column, so the margin
      // between them is not read as an indentation the learner did not make.
      const origin = (listRef.current ?? programRef.current)?.getBoundingClientRect();
      const indent = data.indentationMatters
        ? Math.max(0, Math.round((left - (origin?.left ?? 0)) / stepPixels()))
        : (current.order.find((entry) => entry.lineId === current.lineId)
            ?.indent ?? 0);

      order = [...without];
      order.splice(target, 0, { lineId: current.lineId, indent });
    }

    dragRef.current = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      order,
      overBank,
      // Measured from where the drag began, not from the last position: a
      // slow drag moves a pixel at a time and would otherwise never count as
      // a drag at all — it would end as a click and take the line out.
      moved:
        current.moved ||
        Math.abs(event.clientX - current.fromX) > 3 ||
        Math.abs(event.clientY - current.fromY) > 3,
    };
    redraw();
  };

  const endDrag = () => {
    const current = dragRef.current;
    dragRef.current = null;
    redraw();
    if (!current || !current.moved) return;
    dragged.current = true;

    // Committed once, on release: the answer is where the line was put down,
    // not every position it passed through.
    const before = JSON.stringify(placed);
    if (JSON.stringify(current.order) === before) return;

    onChange(current.order);
    const at = current.order.findIndex(
      (entry) => entry.lineId === current.lineId,
    );
    setAnnouncement(
      at === -1
        ? t("removed", { code: codeOf(current.lineId) })
        : t("movedTo", { code: codeOf(current.lineId), position: at + 1 }),
    );
  };

  usePointerDrag(moveDrag, endDrag);

  /** What a marked line is, in words: colour is never the only channel. */
  const verdict = (outcome: LineOutcome | undefined) => {
    if (!outcome) return undefined;
    if (outcome.distractor) return t("lineStray");
    if (!outcome.placed) return t("lineWrong");
    if (outcome.indented === false) return t("lineIndentWrong");
    return t("lineRight");
  };

  return (
    <div className="bitflow-parsons">
      <p className="bitflow-hint">
        {readonly
          ? t("howToReadonly")
          : data.indentationMatters
            ? t("howToIndent")
            : t("howTo")}
      </p>

      <div className="bitflow-parsons-columns">
        <section ref={bankRef}>
          <h3 className="bitflow-label">{t("bankHeading")}</h3>
          {bank.length === 0 ? (
            <p className="bitflow-text-muted">{t("bankEmpty")}</p>
          ) : (
            <ul className="bitflow-parsons-list">
              {bank.map((line, index) => (
                <li key={line.id}>
                  <button
                    type="button"
                    className="bitflow-parsons-line"
                    data-line={line.id}
                    disabled={readonly}
                    aria-label={t("bankLine", {
                      code: line.text,
                      position: index + 1,
                      total: bank.length,
                    })}
                    onPointerDown={(event) => startDrag(event, line.id, true)}
                    onClick={() => add(line)}
                  >
                    <code>{line.text}</code>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section ref={programRef} className="bitflow-parsons-target">
          <h3 className="bitflow-label">{t("programHeading")}</h3>
          {shown.length === 0 ? (
            <p className="bitflow-text-muted">{t("programEmpty")}</p>
          ) : (
            <ol ref={listRef} className="bitflow-parsons-list bitflow-parsons-program">
              {shown.map((entry, index) => {
                const line = lineById(entry.lineId);
                if (!line) return null;
                const outcome = outcomes?.[index];
                /* The line under the pointer leaves a hole the size it left,
                   so the others move apart and the gap says where it lands. */
                const isGap = drag?.moved === true && drag.lineId === entry.lineId;

                const classes = ["bitflow-parsons-line"];
                if (isGap) classes.push("bitflow-parsons-line-gap");
                if (outcome) {
                  classes.push(
                    outcome.distractor
                      ? "bitflow-parsons-line-stray"
                      : outcome.placed && outcome.indented !== false
                        ? "bitflow-parsons-line-correct"
                        : "bitflow-parsons-line-wrong",
                  );
                }

                return (
                  /* Keyed by the line, not by where it sits: a line keeps its
                     element as the program is rearranged, so the browser keeps
                     the focus and the drag keeps its hold on it. */
                  <li key={entry.lineId}>
                    <button
                      type="button"
                      className={classes.join(" ")}
                      data-line={entry.lineId}
                      disabled={readonly}
                      style={
                        {
                          "--bitflow-parsons-indent": `${entry.indent * STEP_REM}rem`,
                          ...(isGap && drag ? { height: `${drag.height}px` } : {}),
                        } as CSSProperties
                      }
                      aria-label={t("programLine", {
                        code: line.text,
                        position: index + 1,
                        total: shown.length,
                        indent: entry.indent,
                      })}
                      onPointerDown={(event) =>
                        startDrag(event, entry.lineId, false)
                      }
                      onKeyDown={(event) => {
                        const keys: Record<string, () => void> = {
                          ArrowUp: () => move(index, -1),
                          ArrowDown: () => move(index, 1),
                          ArrowLeft: () => indent(index, -1),
                          ArrowRight: () => indent(index, 1),
                          Backspace: () => remove(index),
                        };
                        const action = keys[event.key];
                        if (!action) return;
                        event.preventDefault();
                        action();
                      }}
                      onClick={() => remove(index)}
                    >
                      {!isGap && (
                        <>
                          <span
                            className="bitflow-parsons-number"
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <code>{line.text}</code>
                        </>
                      )}
                      {outcome && (
                        <span className="bitflow-visually-hidden">
                          {" "}
                          {verdict(outcome)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      {/*
        The line itself, following the cursor. Fixed to the viewport and deaf
        to the pointer, so it neither drifts with a scrolling ancestor nor gets
        in the way of the rows it is passing over.
      */}
      {drag?.moved && (
        <div
          className={
            drag.overBank
              ? "bitflow-parsons-line bitflow-parsons-lifted bitflow-parsons-lifted-out"
              : "bitflow-parsons-line bitflow-parsons-lifted"
          }
          aria-hidden="true"
          style={
            {
              width: `${drag.width}px`,
              height: `${drag.height}px`,
              transform: `translate(${drag.x - drag.grabX}px, ${drag.y - drag.grabY}px)`,
            } as CSSProperties
          }
        >
          <code>{codeOf(drag.lineId)}</code>
        </div>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
