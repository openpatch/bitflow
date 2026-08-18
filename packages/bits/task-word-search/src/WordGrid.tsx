import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { wordFound, type WordOutcome } from "./evaluate";
import { messages } from "./messages";
import {
  cellKey,
  cellsBetween,
  cellsOf,
  letterAt,
  lettersOf,
  type Answer,
  type Data,
  type Selection,
} from "./schema";

type Spot = { row: number; column: number };

/**
 * The grid, and the list of what is hidden in it.
 *
 * A word is found by drawing along it — press on its first letter, pull to its
 * last, let go — and the drag snaps to the eight directions a word can run,
 * because a word search is a game of straight lines and a freehand path is
 * never what anyone meant. A run that lands on a word is kept and drawn
 * through; one that lands on nothing simply disappears, and costs nothing.
 *
 * The same two decisions are available from the keyboard — this square, then
 * that one — so the grid is not a picture with a list bolted on beside it.
 */
export const WordGrid = ({
  data,
  answer,
  outcomes,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  /** Per-word marks, once the answer has been checked. */
  outcomes?: WordOutcome[];
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const [cursor, setCursor] = useState<Spot>({ row: 0, column: 0 });
  /** Where a keyboard run was started, if one is in progress. */
  const [anchor, setAnchor] = useState<Spot | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ from: Spot; to: Spot } | null>(null);
  const [, redraw] = useReducer((count: number) => count + 1, 0);

  const words = data.words.filter((word) => lettersOf(word.text).length > 1);
  const found = answer.found;

  /** Every cell already struck through, and which word it belongs to. */
  const struck = new Map<string, string>();
  for (const selection of found) {
    const word = wordFound(data, selection);
    if (!word) continue;
    for (const cell of cellsOf(word)) {
      struck.set(cellKey(cell.row, cell.column), word.id);
    }
  }

  const foundIds = new Set(struck.values());
  const outcomeOf = (wordId: string) =>
    outcomes?.find((outcome) => outcome.wordId === wordId);

  /** The run being drawn, from either the pointer or the keyboard. */
  const drawing: Selection | null = dragRef.current
    ? {
        row: dragRef.current.from.row,
        column: dragRef.current.from.column,
        endRow: dragRef.current.to.row,
        endColumn: dragRef.current.to.column,
      }
    : anchor
      ? { row: anchor.row, column: anchor.column, endRow: cursor.row, endColumn: cursor.column }
      : null;

  const drawn = new Set(
    (drawing ? (cellsBetween(drawing) ?? [{ row: drawing.row, column: drawing.column }]) : [])
      .map((cell) => cellKey(cell.row, cell.column)),
  );

  const commit = (selection: Selection) => {
    const word = wordFound(data, selection);
    if (!word) {
      setAnnouncement(t("nothingThere"));
      return;
    }
    if (foundIds.has(word.id)) {
      setAnnouncement(t("alreadyFound", { word: word.text }));
      return;
    }
    onChange({ found: [...found, selection] });
    setAnnouncement(
      t("wordFound", {
        word: word.text,
        found: foundIds.size + 1,
        total: words.length,
      }),
    );
  };

  // --- pointer --------------------------------------------------------------

  /** The square under a point, or nothing if the point is off the grid. */
  const spotAt = (clientX: number, clientY: number): Spot | undefined => {
    const box = gridRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return undefined;
    const column = Math.floor(((clientX - box.left) / box.width) * data.columns);
    const row = Math.floor(((clientY - box.top) / box.height) * data.rows);
    if (row < 0 || column < 0 || row >= data.rows || column >= data.columns) {
      return undefined;
    }
    return { row, column };
  };

  /**
   * The end of the run, pulled onto the nearest of the eight lines from where
   * it started. Without this a drag two squares across and one down means
   * nothing at all, when it plainly means the horizontal one.
   */
  const straighten = (from: Spot, to: Spot): Spot => {
    const down = to.row - from.row;
    const across = to.column - from.column;
    if (down === 0 || across === 0) return to;

    const length = Math.max(Math.abs(down), Math.abs(across));
    const diagonal = Math.min(Math.abs(down), Math.abs(across));
    // Whichever line the pointer is closest to: along the row, down the
    // column, or the diagonal between them.
    if (diagonal * 2 >= length) {
      const size = Math.round((Math.abs(down) + Math.abs(across)) / 2);
      return {
        row: from.row + Math.sign(down) * size,
        column: from.column + Math.sign(across) * size,
      };
    }
    return Math.abs(across) > Math.abs(down)
      ? { row: from.row, column: to.column }
      : { row: to.row, column: from.column };
  };

  const startDrag = (event: ReactPointerEvent) => {
    if (readonly || event.button !== 0) return;
    const from = spotAt(event.clientX, event.clientY);
    if (!from) return;
    // Or the browser starts a text selection across the grid, and the drag
    // becomes a smear of highlighted letters. That also cancels the focus the
    // press would have given the grid, so it has to take it for itself —
    // otherwise clicking a square and then using the arrow keys does nothing.
    event.preventDefault();
    gridRef.current?.focus();
    dragRef.current = { from, to: from };
    setAnchor(null);
    setCursor(from);
    redraw();
  };

  const moveDrag = (event: PointerEvent | ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const to = spotAt(event.clientX, event.clientY);
    if (!to) return;
    dragRef.current = { ...drag, to: straighten(drag.from, to) };
    redraw();
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    redraw();
    if (!drag) return;
    setCursor(drag.to);
    commit({
      row: drag.from.row,
      column: drag.from.column,
      endRow: drag.to.row,
      endColumn: drag.to.column,
    });
  };

  usePointerDrag(moveDrag, endDrag);

  // --- keyboard -------------------------------------------------------------

  const move = (rowStep: number, columnStep: number) => {
    setCursor((at) => ({
      row: Math.min(data.rows - 1, Math.max(0, at.row + rowStep)),
      column: Math.min(data.columns - 1, Math.max(0, at.column + columnStep)),
    }));
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (readonly) return;
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(0, 1),
      ArrowLeft: () => move(0, -1),
      ArrowDown: () => move(1, 0),
      ArrowUp: () => move(-1, 0),
      Home: () => setCursor((at) => ({ ...at, column: 0 })),
      End: () => setCursor((at) => ({ ...at, column: data.columns - 1 })),
      Escape: () => {
        if (!anchor) return;
        setAnchor(null);
        setAnnouncement(t("runCancelled"));
      },
      Enter: () => mark(),
      " ": () => mark(),
    };

    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  /** Enter starts a run at the cursor, and Enter again finishes it. */
  const mark = () => {
    if (!anchor) {
      setAnchor(cursor);
      setAnnouncement(
        t("runStarted", { row: cursor.row + 1, column: cursor.column + 1 }),
      );
      return;
    }
    const selection = {
      row: anchor.row,
      column: anchor.column,
      endRow: cursor.row,
      endColumn: cursor.column,
    };
    setAnchor(null);
    commit(selection);
  };

  const cellLabel = (row: number, column: number) => {
    const wordId = struck.get(cellKey(row, column));
    const word = words.find((candidate) => candidate.id === wordId);
    return t("cellAt", {
      letter: letterAt(data, row, column) ?? "",
      row: row + 1,
      column: column + 1,
    }) + (word ? `. ${t("partOf", { word: word.text })}` : "");
  };

  return (
    <div className="bitflow-wordsearch">
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      <div className="bitflow-wordsearch-columns">
        <div
          ref={gridRef}
          className="bitflow-wordsearch-grid"
          role="grid"
          aria-label={t("gridLabel")}
          tabIndex={readonly ? -1 : 0}
          aria-activedescendant={`cell-${cursor.row}-${cursor.column}`}
          style={{ "--bitflow-wordsearch-columns": data.columns } as never}
          onPointerDown={startDrag}
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: data.rows }, (_row, row) => (
            <div key={row} role="row" className="bitflow-wordsearch-row">
              {Array.from({ length: data.columns }, (_column, column) => {
                const key = cellKey(row, column);
                const classes = ["bitflow-wordsearch-cell"];
                if (struck.has(key)) classes.push("bitflow-wordsearch-cell-found");
                if (drawn.has(key)) classes.push("bitflow-wordsearch-cell-drawing");
                if (cursor.row === row && cursor.column === column) {
                  classes.push("bitflow-wordsearch-cell-cursor");
                }
                return (
                  <span
                    key={column}
                    id={`cell-${row}-${column}`}
                    role="gridcell"
                    className={classes.join(" ")}
                    aria-label={cellLabel(row, column)}
                    aria-selected={drawn.has(key)}
                  >
                    {/* The letter sits in its own element so it can be sized
                        against the square: a container query unit used on the
                        container itself is circular, and the grid comes out
                        one letter tall. */}
                    <span className="bitflow-wordsearch-letter">
                      {letterAt(data, row, column)}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bitflow-wordsearch-words">
          <h3 className="bitflow-label">
            {t("wordsHeading", { found: foundIds.size, total: words.length })}
          </h3>
          {data.showWords ? (
            <ul className="bitflow-wordsearch-list">
              {words.map((word) => {
                const outcome = outcomeOf(word.id);
                const isFound = foundIds.has(word.id);
                return (
                  <li
                    key={word.id}
                    className={
                      isFound
                        ? "bitflow-wordsearch-word bitflow-wordsearch-word-found"
                        : "bitflow-wordsearch-word"
                    }
                  >
                    <span>{word.text}</span>
                    {/* In words as well as by a line through it. */}
                    <span className="bitflow-visually-hidden">
                      {" "}
                      {isFound ? t("isFound") : t("notFound")}
                    </span>
                    {outcome && !outcome.found && (
                      <span className="bitflow-wordsearch-missed">{t("missed")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="bitflow-text-muted">
              {t("hiddenWords", { total: words.length })}
            </p>
          )}
        </div>
      </div>

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
