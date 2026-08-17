import { translate, type Locale } from "@bitflow/core";
import { useMemo, useState, type ReactElement } from "react";
import { messages } from "./messages";
import { COLORS, type Color, type Data, type Highlights } from "./schema";

export type Token = { text: string; start: number; end: number; word: boolean };

/**
 * Splits the text into word and non-word runs, each remembering where it sits
 * in the original string.
 *
 * The stored highlighting stays per character — that is what the evaluator
 * compares — but the *interaction* is per word. Dragging across characters
 * cannot be done with a keyboard without caret browsing, and word-level marking
 * is what a task like "mark the cause" actually asks for. So a word is one
 * button: clickable, tappable, and reachable with Tab.
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

/** The colour covering a token, if the whole token carries the same one. */
const colorOf = (highlights: Highlights, token: Token): Color | null => {
  const first = highlights[token.start] ?? null;
  for (let i = token.start; i < token.end; i++) {
    if ((highlights[i] ?? null) !== first) return null;
  }
  return first;
};

const paint = (
  highlights: Highlights,
  length: number,
  token: Token,
  color: Color | null,
): Highlights => {
  const next = Array.from({ length }, (_, i) => highlights[i] ?? null);
  for (let i = token.start; i < token.end; i++) next[i] = color;
  return next;
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

  return (
    <div className="bitflow-stack-small bitflow-stack">
      {!readonly && enabled.length > 0 && (
        <div className="bitflow-highlight-palette" role="group" aria-label={t("pickColor")}>
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

      {!readonly && <p className="bitflow-hint">{t("keyboardHint")}</p>}

      <p className="bitflow-highlight-text">
        {tokens.map((token) => {
          const color = colorOf(highlights, token);

          if (!token.word) {
            return (
              <span
                key={token.start}
                className={color ? `bitflow-highlight-${color}` : undefined}
              >
                {token.text}
              </span>
            );
          }

          return (
            <button
              key={token.start}
              type="button"
              disabled={readonly}
              // `aria-pressed` plus the colour's own name in the accessible
              // label: what has been marked, and as what, without seeing it.
              aria-pressed={color !== null}
              aria-label={
                color ? `${token.text} — ${label(color)}` : token.text
              }
              className={[
                "bitflow-highlight-token",
                color ? `bitflow-highlight-${color}` : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                onChange(
                  paint(
                    highlights,
                    text.length,
                    token,
                    color === active ? null : active,
                  ),
                )
              }
            >
              {token.text}
            </button>
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
