import { translate, type Locale } from "@bitflow/core";
import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from "react";
import { cellOutcome, type WordOutcome } from "./evaluate";
import { cluesOf, gridOf, pathOf, type Cell, type NumberedWord } from "./grid";
import { messages } from "./messages";
import {
  cellKey,
  normalise,
  type Answer,
  type Data,
  type Orientation,
} from "./schema";

type Spot = { row: number; column: number };

/**
 * The grid and its clues.
 *
 * A crossword is one of the few puzzles almost everyone already knows how to
 * use, so this behaves the way a newspaper crossword behaves: click a square
 * to start typing, click it again to turn the corner, and the word you are in
 * is lit up so you can see what you are answering. Typing moves you along;
 * Backspace walks you back.
 *
 * The clue list is not decoration either. Every clue is a text field of
 * exactly the right length, wired to the same letters as the grid — which is
 * how this is answered with a screen reader, on a phone, or by anyone who
 * would rather read the clue and type the word than hunt for the square.
 */
export const Crossword = ({
  data,
  answer,
  outcomes,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  answer: Answer;
  /** Per-clue marks, once the answer has been checked. */
  outcomes?: WordOutcome[];
  locale: Locale;
  readonly?: boolean;
  onChange: (answer: Answer) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const grid = gridOf(data);
  const clues = cluesOf(grid);
  const first = grid.words[0];

  const [spot, setSpot] = useState<Spot>({
    row: first?.row ?? 0,
    column: first?.column ?? 0,
  });
  const [direction, setDirection] = useState<Orientation>(
    first?.orientation ?? "across",
  );
  const cellRefs = useRef(new Map<string, HTMLInputElement | null>());
  /**
   * Where the cursor was when the mouse went down.
   *
   * Clicking a square focuses it, and React has re-rendered by the time the
   * click itself arrives — so asking "is this the square the cursor is on?"
   * from the click handler is always answered yes, and every first click
   * would turn the corner as well as selecting the square. The question has
   * to be asked before the press lands.
   */
  const pressedAt = useRef<string | null>(null);

  const cellAt = (at: Spot) => grid.cells.get(cellKey(at.row, at.column));
  const letterAt = (at: Spot) => answer.letters[cellKey(at.row, at.column)] ?? "";

  // The author can move a word out from under the cursor between renders, so
  // where the cursor was left is not always a square any more.
  const cursor: Spot = cellAt(spot)
    ? spot
    : { row: first?.row ?? 0, column: first?.column ?? 0 };

  /** The word the cursor is in, falling back to the other direction. */
  const currentWord = ((): NumberedWord | undefined => {
    const cell = cellAt(cursor);
    const id = cell?.[direction] ?? cell?.[direction === "across" ? "down" : "across"];
    return grid.words.find((word) => word.id === id);
  })();

  const currentPath = currentWord ? pathOf(grid, currentWord.id) : [];
  const inCurrentWord = (cell: Cell) =>
    currentPath.some(
      (step) => step.row === cell.row && step.column === cell.column,
    );

  const focus = (at: Spot) => {
    setSpot(at);
    cellRefs.current.get(cellKey(at.row, at.column))?.focus();
  };

  const write = (at: Spot, letter: string) => {
    if (readonly) return;
    const key = cellKey(at.row, at.column);
    const letters = { ...answer.letters };
    if (letter) letters[key] = letter;
    // Deleted rather than left empty, so a blanked square is indistinguishable
    // from one never visited — including in the saved file.
    else delete letters[key];
    onChange({ letters });
  };

  /** The next square along the current word, or nothing at its end. */
  const along = (at: Spot, delta: number): Spot | undefined => {
    const index = currentPath.findIndex(
      (step) => step.row === at.row && step.column === at.column,
    );
    const next = currentPath[index + delta];
    return next ? { row: next.row, column: next.column } : undefined;
  };

  /** The nearest square in a direction, skipping over the gaps. */
  const nearest = (at: Spot, rowStep: number, columnStep: number) => {
    for (let n = 1; n <= Math.max(grid.rows, grid.columns); n++) {
      const next = { row: at.row + rowStep * n, column: at.column + columnStep * n };
      if (cellAt(next)) return next;
    }
    return undefined;
  };

  const selectWord = (word: NumberedWord) => {
    setDirection(word.orientation);
    focus({ row: word.row, column: word.column });
  };

  const onCellKeyDown = (event: ReactKeyboardEvent, at: Spot) => {
    const go = (next: Spot | undefined) => next && focus(next);

    const moves: Record<string, () => void> = {
      // A perpendicular arrow turns the corner rather than leaving the word,
      // which is what every crossword on paper and screen does.
      ArrowRight: () =>
        direction === "across"
          ? go(nearest(at, 0, 1))
          : setDirection("across"),
      ArrowLeft: () =>
        direction === "across"
          ? go(nearest(at, 0, -1))
          : setDirection("across"),
      ArrowDown: () =>
        direction === "down" ? go(nearest(at, 1, 0)) : setDirection("down"),
      ArrowUp: () =>
        direction === "down" ? go(nearest(at, -1, 0)) : setDirection("down"),
      Home: () => go(currentPath[0]),
      End: () => go(currentPath[currentPath.length - 1]),
      " ": () => setDirection(direction === "across" ? "down" : "across"),
      Backspace: () => {
        if (letterAt(at)) {
          write(at, "");
          return;
        }
        const back = along(at, -1);
        if (!back) return;
        write(back, "");
        go(back);
      },
      Delete: () => write(at, ""),
    };

    const action = moves[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const onCellInput = (at: Spot, value: string) => {
    const letter = normalise(value.slice(-1));
    if (!letter) return;
    write(at, letter);
    const next = along(at, 1);
    if (next) focus(next);
  };

  /** The whole word typed into the clue list, spread over its squares. */
  const writeWord = (word: NumberedWord, value: string) => {
    if (readonly) return;
    const letters = { ...answer.letters };
    pathOf(grid, word.id).forEach((cell, index) => {
      const letter = normalise(value[index] ?? "");
      const key = cellKey(cell.row, cell.column);
      if (letter) letters[key] = letter;
      else delete letters[key];
    });
    onChange({ letters });
  };

  const wordValue = (word: NumberedWord) =>
    pathOf(grid, word.id)
      .map((cell) => answer.letters[cellKey(cell.row, cell.column)] ?? " ")
      .join("")
      .trimEnd();

  const outcomeOf = (wordId: string) =>
    outcomes?.find((outcome) => outcome.wordId === wordId);

  /** What a square is, said out loud: where it is and what it answers. */
  function cellLabel(cell: Cell): string {
    const parts = [t("cellAt", { row: cell.row + 1, column: cell.column + 1 })];
    for (const orientation of ["across", "down"] as const) {
      const word = grid.words.find((candidate) => candidate.id === cell[orientation]);
      if (!word) continue;
      const index =
        pathOf(grid, word.id).findIndex(
          (step) => step.row === cell.row && step.column === cell.column,
        ) + 1;
      parts.push(
        t("cellIn", {
          number: word.number,
          direction: t(orientation),
          clue: word.clue,
          position: index,
          letters: word.letters.length,
        }),
      );
    }
    return parts.join(". ");
  }

  if (grid.words.length === 0) {
    return <p className="bitflow-text-muted">{t("empty")}</p>;
  }

  return (
    <div className="bitflow-crossword">
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      <div className="bitflow-crossword-columns">
        <div
          className="bitflow-crossword-grid"
          role="grid"
          aria-label={t("gridLabel")}
          style={{ "--bitflow-crossword-columns": grid.columns } as never}
        >
          {Array.from({ length: grid.rows }, (_row, row) => (
            <div key={row} role="row" className="bitflow-crossword-row">
              {Array.from({ length: grid.columns }, (_column, column) => {
                const cell = cellAt({ row, column });
                if (!cell) {
                  return (
                    <span
                      key={column}
                      role="gridcell"
                      aria-hidden="true"
                      className="bitflow-crossword-blank"
                    />
                  );
                }

                const here = cursor.row === row && cursor.column === column;
                const mark = outcomes
                  ? cellOutcome(grid, answer, row, column)
                  : undefined;

                const classes = ["bitflow-crossword-cell"];
                if (inCurrentWord(cell)) classes.push("bitflow-crossword-cell-word");
                if (here) classes.push("bitflow-crossword-cell-here");
                if (mark) classes.push(`bitflow-crossword-cell-${mark}`);

                return (
                  <div key={column} role="gridcell" className={classes.join(" ")}>
                    {cell.number !== undefined && (
                      <span className="bitflow-crossword-number" aria-hidden="true">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(element) => {
                        cellRefs.current.set(cellKey(row, column), element);
                      }}
                      className="bitflow-crossword-input"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={1}
                      disabled={readonly}
                      // One tab stop for the whole grid: Tab has to be able to
                      // leave it, or a keyboard user is shut in.
                      tabIndex={here ? 0 : -1}
                      value={letterAt({ row, column })}
                      aria-label={cellLabel(cell)}
                      onFocus={() => setSpot({ row, column })}
                      onPointerDown={() => {
                        pressedAt.current = cellKey(cursor.row, cursor.column);
                      }}
                      onClick={() => {
                        if (pressedAt.current !== cellKey(row, column)) return;
                        setDirection(direction === "across" ? "down" : "across");
                      }}
                      onKeyDown={(event) => onCellKeyDown(event, { row, column })}
                      onChange={(event) =>
                        onCellInput({ row, column }, event.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bitflow-crossword-clues">
          {(["across", "down"] as const).map((orientation) =>
            clues[orientation].length === 0 ? null : (
              <section key={orientation}>
                <h3 className="bitflow-label">{t(orientation)}</h3>
                <ul className="bitflow-crossword-clue-list">
                  {clues[orientation].map((word) => {
                    const outcome = outcomeOf(word.id);
                    const current = currentWord?.id === word.id;
                    return (
                      <li
                        key={word.id}
                        className={
                          current
                            ? "bitflow-crossword-clue bitflow-crossword-clue-current"
                            : "bitflow-crossword-clue"
                        }
                      >
                        <button
                          type="button"
                          className="bitflow-crossword-clue-text"
                          onClick={() => selectWord(word)}
                        >
                          <span className="bitflow-crossword-number">
                            {word.number}
                          </span>
                          <span>{word.clue}</span>
                        </button>
                        <input
                          className="bitflow-crossword-word"
                          type="text"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          maxLength={word.letters.length}
                          style={
                            {
                              "--bitflow-crossword-letters": word.letters.length,
                            } as never
                          }
                          disabled={readonly}
                          value={wordValue(word)}
                          aria-label={t("wordLabel", {
                            number: word.number,
                            direction: t(word.orientation),
                            clue: word.clue,
                            letters: word.letters.length,
                          })}
                          onFocus={() => setDirection(word.orientation)}
                          onChange={(event) => writeWord(word, event.target.value)}
                        />
                        {outcome && (
                          <span
                            className={
                              outcome.correct
                                ? "bitflow-crossword-mark bitflow-crossword-mark-correct"
                                : "bitflow-crossword-mark bitflow-crossword-mark-wrong"
                            }
                          >
                            {outcome.correct
                              ? t("clueRight")
                              : outcome.complete
                                ? t("clueWrong")
                                : t("clueUnfinished")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
          )}
        </div>
      </div>
    </div>
  );
};
