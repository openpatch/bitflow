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
    // A finger on the line is a scroll — bank and program fill the width, and
    // a list that took every touch for a drag would leave nowhere to scroll
    // the step from. Only the grip, which says it can be taken hold of, starts
    // a drag; a finger on the body still taps to add or remove the line.
    if (isFinger(event.pointerType) && !isGrip(event.target)) return;
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

  const moveDrag = (event: Pick<PointerEvent, "clientX" | "clientY">) => {
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
    if (dragRef.current.moved) {
      autoScroll.follow(programRef.current, event.clientX, event.clientY);
    }
    redraw();
  };

  const endDrag = () => {
    autoScroll.stop();
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

  // The lines move under a pointer that holds still while the columns scroll,
  // so what it is over is measured again after every step of the scroll.
  const autoScroll = useAutoScroll(() => {
    const current = dragRef.current;
    if (current) moveDrag({ clientX: current.x, clientY: current.y });
  });

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
    <div
      className={
        data.display === "structogram"
          ? "bitflow-parsons bitflow-parsons-structogram"
          : "bitflow-parsons"
      }
    >
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
                    {!readonly && <Grip />}
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
                const block =
                  data.display === "structogram" ? blockOf(shown, index, lineById) : undefined;
                if (block) classes.push(`bitflow-parsons-line-${block}`);
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
                  <li key={entry.lineId} className="bitflow-parsons-row">
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
                          {!readonly && <Grip />}
                          <span
                            className="bitflow-parsons-number"
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <code>{line.text}</code>
                          {/* The two cases of a Verzweigung, named where the
                              triangle's sides come down, as a structogram
                              draws them. */}
                          {block === "branch" && (
                            <span className="bitflow-parsons-cases" aria-hidden="true">
                              <span>{t("yes")}</span>
                              <span>{t("no")}</span>
                            </span>
                          )}
                        </>
                      )}
                      {outcome && (
                        <span className="bitflow-visually-hidden">
                          {" "}
                          {verdict(outcome)}
                        </span>
                      )}
                    </button>
                    {/* The arrow keys, as buttons, for a touch screen: dragging a
                        line to exactly the right place and nesting with a thumb
                        is fiddly, and a tap is not. Shown only for a coarse
                        pointer — a mouse drags, a keyboard has the keys. */}
                    {!readonly && !isGap && (
                      <div className="bitflow-parsons-actions">
                        <button
                          type="button"
                          className="bitflow-parsons-action"
                          aria-label={t("moveUp", { code: line.text })}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="bitflow-parsons-action"
                          aria-label={t("moveDown", { code: line.text })}
                          disabled={index === shown.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          ↓
                        </button>
                        {data.indentationMatters && (
                          <>
                            <button
                              type="button"
                              className="bitflow-parsons-action"
                              aria-label={t("outdent", { code: line.text })}
                              disabled={entry.indent === 0}
                              onClick={() => indent(index, -1)}
                            >
                              ⇤
                            </button>
                            <button
                              type="button"
                              className="bitflow-parsons-action"
                              aria-label={t("indent", { code: line.text })}
                              onClick={() => indent(index, 1)}
                            >
                              ⇥
                            </button>
                          </>
                        )}
                      </div>
                    )}
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
          <Grip />
          <code>{codeOf(drag.lineId)}</code>
        </div>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};

/** Where a finger takes hold of a line. Decoration to anything but a touch. */
const Grip = () => <span className="bitflow-parsons-grip" aria-hidden="true" />;

/** A touch or a pen: a pointer whose drag the browser would take for a scroll. */
const isFinger = (pointerType: string): boolean =>
  pointerType === "touch" || pointerType === "pen";

const isGrip = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(".bitflow-parsons-grip") !== null;

/**
 * What a program line is in a structogram, read off the lines themselves.
 *
 * A line with deeper lines after it opens a block: a Verzweigung when it reads
 * like one — "wenn", "falls", "if" — and a loop otherwise ("solange", "für",
 * "wiederhole", "while", "for"). A line reading "sonst" or "else" starts the
 * other case of the Verzweigung above it. Read from the words rather than
 * authored, so the notation costs the author nothing; a puzzle whose lines use
 * other words is still drawn, just with every block as a loop's frame.
 */
const BRANCH = /^\s*(wenn|falls|if)\b/i;
const OTHERWISE = /^\s*(sonst|else)\b/i;

const blockOf = (
  lines: PlacedLine[],
  index: number,
  lineById: (id: string) => Line | undefined,
): "branch" | "else" | "loop" | undefined => {
  const text = lineById(lines[index].lineId)?.text ?? "";
  if (OTHERWISE.test(text)) return "else";
  const next = lines[index + 1];
  if (!next || next.indent <= lines[index].indent) return undefined;
  return BRANCH.test(text) ? "branch" : "loop";
};
