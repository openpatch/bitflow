import { translate, type Locale } from "@bitflow/core";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { messages } from "./messages";
import { COLORS, type Color, type Data, type Highlights } from "./schema";

export type Token = { text: string; start: number; end: number; word: boolean };

/**
 * Splits the text into word and non-word runs, each remembering where it sits
 * in the original string. The stored highlighting is per character — that is
 * what the evaluator compares — and these runs are what the learner touches.
 */
export const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  const pattern = /\p{L}[\p{L}\p{N}'’-]*|\p{N}+/gu;
  let last = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index > last) {
      tokens.push({
        text: text.slice(last, match.index),
        start: last,
        end: match.index,
        word: false,
      });
    }
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      word: true,
    });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    tokens.push({ text: text.slice(last), start: last, end: text.length, word: false });
  }
  return tokens;
};

/** The colour covering a range, if the whole range carries the same one. */
const colorOf = (
  highlights: Highlights,
  from: number,
  to: number,
): Color | null => {
  const first = highlights[from] ?? null;
  for (let i = from; i < to; i++) {
    if ((highlights[i] ?? null) !== first) return null;
  }
  return first;
};

const paint = (
  highlights: Highlights,
  length: number,
  from: number,
  to: number,
  color: Color | null,
): Highlights => {
  const next = Array.from({ length }, (_, i) => highlights[i] ?? null);
  for (let i = Math.max(0, from); i < Math.min(length, to); i++) next[i] = color;
  return next;
};

/**
 * Where a DOM position sits in the original string.
 *
 * Every run is one span holding exactly one text node, and each span records
 * the index it starts at — so an offset inside that node plus the span's start
 * is the absolute character index.
 */
const offsetOf = (node: Node | null, offset: number): number | null => {
  const element =
    node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null);
  const span = element?.closest<HTMLElement>("[data-start]");
  if (!span) return null;
  const start = Number(span.dataset.start);
  return Number.isFinite(start) ? start + offset : null;
};

export type HighlighterProps = {
  text: string;
  highlights: Highlights;
  colors: Data["colors"];
  locale: Locale;
  readonly?: boolean;
  onChange: (highlights: Highlights) => void;
};

export const Highlighter = ({
  text,
  highlights,
  colors,
  locale,
  readonly,
  onChange,
}: HighlighterProps): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const enabled = COLORS.filter((color) => colors[color]?.enabled);
  const [active, setActive] = useState<Color | null>(enabled[0] ?? null);
  const tokens = useMemo(() => tokenize(text), [text]);

  const label = (color: Color) =>
    colors[color]?.label || translate(messages, color, locale);

  const apply = useCallback(
    (from: number, to: number, color: Color | null) =>
      onChange(paint(highlights, text.length, from, to, color)),
    [highlights, onChange, text.length],
  );

  /**
   * Marks whatever the learner has selected.
   *
   * Dragging across text is what "highlighting" means, so it has to be the
   * primary gesture — clicking a word is the shortcut, not the whole
   * interaction. Runs are plain spans rather than buttons precisely so the
   * browser will let them be selected.
   */
  const applySelection = useCallback(() => {
    if (readonly) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const from = offsetOf(selection.anchorNode, selection.anchorOffset);
    const to = offsetOf(selection.focusNode, selection.focusOffset);
    if (from === null || to === null || from === to) return;

    apply(Math.min(from, to), Math.max(from, to), active);
    // Otherwise the browser's blue selection sits on top of the mark the
    // learner just made, and they cannot see what they did.
    selection.removeAllRanges();
  }, [active, apply, readonly]);

  const toggleWord = useCallback(
    (token: Token) => {
      if (readonly) return;
      const current = colorOf(highlights, token.start, token.end);
      apply(token.start, token.end, current === active ? null : active);
    },
    [active, apply, highlights, readonly],
  );

  return (
    <div className="bitflow-stack-small bitflow-stack">
      {!readonly && enabled.length > 0 && (
        <div
          className="bitflow-highlight-palette"
          role="group"
          aria-label={t("pickColor")}
        >
          {enabled.map((color) => (
            <label
              key={color}
              className={`bitflow-highlight-swatch bitflow-highlight-${color}`}
            >
              <input
                type="radio"
                name="bitflow-highlight-color"
                className="bitflow-visually-hidden"
                checked={active === color}
                onChange={() => setActive(color)}
              />
              <span>{label(color)}</span>
            </label>
          ))}
          <label className="bitflow-highlight-swatch bitflow-highlight-eraser">
            <input
              type="radio"
              name="bitflow-highlight-color"
              className="bitflow-visually-hidden"
              checked={active === null}
              onChange={() => setActive(null)}
            />
            <span>{t("eraser")}</span>
          </label>
        </div>
      )}

      {!readonly && <p className="bitflow-hint">{t("howTo")}</p>}

      {/* Selection is finished on mouse-up, and on key-up for anyone selecting
          with shift and the arrow keys under caret browsing. */}
      <p
        className="bitflow-highlight-text"
        onMouseUp={applySelection}
        onKeyUp={applySelection}
      >
        {tokens.map((token) => {
          const color = colorOf(highlights, token.start, token.end);
          const className = [
            token.word ? "bitflow-highlight-token" : "",
            color ? `bitflow-highlight-${color}` : "",
          ]
            .filter(Boolean)
            .join(" ");

          if (!token.word) {
            return (
              <span key={token.start} data-start={token.start} className={className}>
                {token.text}
              </span>
            );
          }

          return (
            <span
              key={token.start}
              data-start={token.start}
              className={className}
              // A span rather than a button: a button cannot be selected as
              // text in every browser, which would break the drag gesture.
              // The role and tab stop give it the same keyboard behaviour.
              role={readonly ? undefined : "button"}
              tabIndex={readonly ? undefined : 0}
              aria-pressed={readonly ? undefined : color !== null}
              aria-label={color ? `${token.text} — ${label(color)}` : token.text}
              onClick={() => {
                // A drag that ends inside a word is a selection, not a click.
                if (!window.getSelection()?.isCollapsed) return;
                toggleWord(token);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                toggleWord(token);
              }}
            >
              {token.text}
            </span>
          );
        })}
      </p>

      {!readonly && (
        <div className="bitflow-row">
          <button
            type="button"
            className="bitflow-button bitflow-button-secondary"
            onClick={() => onChange(new Array(text.length).fill(null))}
          >
            {t("clear")}
          </button>
        </div>
      )}
    </div>
  );
};
