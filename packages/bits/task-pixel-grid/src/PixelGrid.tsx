import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { messages } from "./messages";
import {
  blankCells,
  contrastColor,
  paintCell,
  paletteEntry,
  type Data,
} from "./schema";

type Spot = { row: number; column: number };

export type PixelGridProps = {
  data: Data;
  /** The colours to show, one palette id per cell, rows by columns. Already
   * resolved by the caller — this component paints and displays, it does not
   * decide what a locked cell looks like. */
  cells: string[][];
  locale: Locale;
  readonly?: boolean;
  /** Cells the learner may not repaint. */
  given?: boolean[][];
  /** Marks a free cell as wrong, once the answer has been checked. */
  wrong?: boolean[][];
  onChange?: (cells: string[][]) => void;
  /**
   * Refuses to repaint a `given` cell. On for the learner's own answer; off
   * while the author paints the picture itself, which has to be free to draw
   * over a cell it will only lock afterwards.
   */
  lockGiven?: boolean;
  /** Authoring only: painting a cell toggles `given` instead of its colour. */
  toggleGiven?: boolean;
  onToggleGiven?: (row: number, column: number) => void;
  /** Overrides the default instruction line, e.g. while marking given cells. */
  hint?: string;
  showClear?: boolean;
};

/**
 * The grid itself: a palette of swatches, then the squares it paints.
 *
 * Reused for three things — the learner's answer, the author's painting of
 * the target picture, and the author's marking of which cells are given —
 * because all three are "pick a cell, do something to it" and keeping one
 * component means the learner never meets a grid that behaves differently
 * from the one it was authored on.
 */
export const PixelGrid = ({
  data,
  cells,
  locale,
  readonly,
  given,
  wrong,
  onChange,
  lockGiven = true,
  toggleGiven = false,
  onToggleGiven,
  hint,
  showClear = true,
}: PixelGridProps): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const [cursor, setCursor] = useState<Spot>({ row: 0, column: 0 });
  const [activeColorId, setActiveColorId] = useState(
    data.palette[0]?.id ?? "",
  );
  const [announcement, setAnnouncement] = useState("");
  // One radio group per grid: a form showing the author's picture above a
  // learner preview has two palettes on the page, and a shared `name` would
  // make choosing a colour in one clear the choice in the other.
  const group = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  /** The grid mid-drag, mutated cell by cell so a fast drag never paints from
   * a `cells` prop that has not caught up with the render it came from. */
  const bufferRef = useRef<string[][]>(cells);
  const draggingRef = useRef(false);
  const lastRef = useRef<Spot | null>(null);

  // Falls back to the first entry when the one last picked has since been
  // removed from the palette — an authoring-time edge case, but one that
  // would otherwise paint a colour id nothing in the palette recognises.
  const activeId =
    data.palette.find((entry) => entry.id === activeColorId)?.id ??
    data.palette[0]?.id ??
    "";

  const colorLabel = (id: string | undefined, index: number) => {
    const entry = paletteEntry(data, id);
    return entry?.label || entry?.id || t("colorFallback", { number: index + 1 });
  };

  const selectColor = (id: string) => {
    setActiveColorId(id);
    const index = data.palette.findIndex((entry) => entry.id === id);
    setAnnouncement(t("selectedColor", { color: colorLabel(id, index) }));
  };

  const commitPaint = (row: number, column: number) => {
    if (readonly) return;
    if (toggleGiven) {
      onToggleGiven?.(row, column);
      return;
    }
    if (lockGiven && (given?.[row]?.[column] ?? false)) return;
    if (!draggingRef.current) bufferRef.current = cells;
    const next = paintCell(bufferRef.current, row, column, activeId);
    bufferRef.current = next;
    onChange?.(next);
  };

  // --- pointer ----------------------------------------------------------

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

  const startDrag = (event: ReactPointerEvent) => {
    if (readonly || event.button !== 0) return;
    const spot = spotAt(event.clientX, event.clientY);
    if (!spot) return;
    // Or the browser starts a text selection across the grid, which also
    // cancels the focus the press would have given it — leaving the arrow
    // keys doing nothing right after a click.
    event.preventDefault();
    gridRef.current?.focus();
    draggingRef.current = true;
    bufferRef.current = cells;
    lastRef.current = spot;
    setCursor(spot);
    commitPaint(spot.row, spot.column);
  };

  const moveDrag = (event: PointerEvent) => {
    if (!draggingRef.current) return;
    const spot = spotAt(event.clientX, event.clientY);
    if (!spot) return;
    if (lastRef.current && lastRef.current.row === spot.row && lastRef.current.column === spot.column) {
      return;
    }
    lastRef.current = spot;
    setCursor(spot);
    commitPaint(spot.row, spot.column);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  usePointerDrag(moveDrag, endDrag);

  // --- keyboard -----------------------------------------------------------

  const move = (rowStep: number, columnStep: number) => {
    setCursor((at) => ({
      row: Math.min(data.rows - 1, Math.max(0, at.row + rowStep)),
      column: Math.min(data.columns - 1, Math.max(0, at.column + columnStep)),
    }));
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (readonly) return;

    if (/^[1-9]$/.test(event.key) && !toggleGiven) {
      const entry = data.palette[Number(event.key) - 1];
      if (entry) {
        event.preventDefault();
        selectColor(entry.id);
      }
      return;
    }

    const keys: Record<string, () => void> = {
      ArrowRight: () => move(0, 1),
      ArrowLeft: () => move(0, -1),
      ArrowDown: () => move(1, 0),
      ArrowUp: () => move(-1, 0),
      Enter: () => commitPaint(cursor.row, cursor.column),
      " ": () => commitPaint(cursor.row, cursor.column),
    };

    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const cellLabel = (row: number, column: number) => {
    const id = cells[row]?.[column];
    const index = data.palette.findIndex((entry) => entry.id === id);
    const parts = [t("cellAt", { color: colorLabel(id, index), row: row + 1, column: column + 1 })];
    if (given?.[row]?.[column]) parts.push(t("given"));
    if (wrong?.[row]?.[column]) parts.push(t("wrong"));
    return parts.join(". ");
  };

  return (
    <div className="bitflow-stack-small bitflow-stack">
      {!readonly && !toggleGiven && (
        <div
          className="bitflow-pixelgrid-palette"
          role="group"
          aria-label={t("pickColor")}
        >
          {data.palette.map((entry, index) => (
            <label key={entry.id} className="bitflow-pixelgrid-swatch">
              <input
                type="radio"
                name={group}
                className="bitflow-visually-hidden"
                checked={activeId === entry.id}
                onChange={() => selectColor(entry.id)}
              />
              <span
                className="bitflow-pixelgrid-swatch-fill"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              <span>
                {entry.label || t("colorFallback", { number: index + 1 })}
                {index < 9 ? ` (${index + 1})` : ""}
              </span>
            </label>
          ))}
        </div>
      )}

      <p className="bitflow-hint">
        {hint ?? (readonly ? t("howToReadonly") : t("howTo"))}
      </p>

      <div
        className={
          data.showCoordinates
            ? "bitflow-pixelgrid-table bitflow-pixelgrid-coords"
            : "bitflow-pixelgrid-table"
        }
        // On the wrapper, not the grid: the wrapper is what is sized from the
        // column count, and a custom property only reaches down the tree.
        style={{ "--bitflow-pixelgrid-columns": data.columns } as never}
      >
        {data.showCoordinates && (
          <>
            <div className="bitflow-pixelgrid-corner" aria-hidden="true" />
            <div className="bitflow-pixelgrid-colheads" aria-hidden="true">
              {Array.from({ length: data.columns }, (_column, column) => (
                <span key={column}>{column + 1}</span>
              ))}
            </div>
            <div className="bitflow-pixelgrid-rowheads" aria-hidden="true">
              {Array.from({ length: data.rows }, (_row, row) => (
                <span key={row}>{row + 1}</span>
              ))}
            </div>
          </>
        )}

        <div
          ref={gridRef}
          className="bitflow-pixelgrid-grid"
          role="grid"
          aria-label={t("gridLabel")}
          tabIndex={readonly ? -1 : 0}
          aria-activedescendant={`${group}-${cursor.row}-${cursor.column}`}
          onPointerDown={startDrag}
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: data.rows }, (_row, row) => (
            <div key={row} role="row" className="bitflow-pixelgrid-row">
              {Array.from({ length: data.columns }, (_column, column) => {
                const id = cells[row]?.[column];
                const entry = paletteEntry(data, id);
                const isGivenCell = given?.[row]?.[column] ?? false;
                const isWrongCell = wrong?.[row]?.[column] ?? false;
                const classes = ["bitflow-pixelgrid-cell"];
                if (isGivenCell) classes.push("bitflow-pixelgrid-cell-given");
                if (isWrongCell) classes.push("bitflow-pixelgrid-cell-wrong");
                if (cursor.row === row && cursor.column === column) {
                  classes.push("bitflow-pixelgrid-cell-cursor");
                }
                return (
                  <span
                    key={column}
                    id={`${group}-${row}-${column}`}
                    role="gridcell"
                    className={classes.join(" ")}
                    style={{ background: entry?.color ?? "transparent" }}
                    aria-label={cellLabel(row, column)}
                  >
                    {data.showLabels && entry && (
                      <span
                        className="bitflow-pixelgrid-label"
                        style={{ color: contrastColor(entry.color) }}
                        aria-hidden="true"
                      >
                        {entry.label || entry.id}
                      </span>
                    )}
                    {isWrongCell && (
                      <span className="bitflow-visually-hidden">{t("wrong")}</span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {!readonly && !toggleGiven && showClear && (
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => onChange?.(blankCells(data))}
          >
            {t("clear")}
          </button>
        </div>
      )}

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
