import { translate, type Locale } from "@bitflow/core";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { messages } from "./messages";
import type { Match, Pair, Side } from "./schema";

/** One connection, in coordinates relative to the two columns. */
type Line = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Set once the answer is marked. */
  correct?: boolean;
};

/**
 * Two columns, and the pairings between them.
 *
 * Pick a card on the left, then the one on the right that goes with it. Two
 * clicks, two taps, or two Enters — the same operation whatever is driving it,
 * which is why there is no separate keyboard path here to fall behind the
 * real one. Nothing about this task is spatial, so a list is not a fallback
 * for dragging; it is the natural shape of the question.
 */
export const Columns = ({
  pairs,
  leftOrder,
  rightOrder,
  matches,
  results,
  locale,
  readonly,
  onChange,
}: {
  pairs: Pair[];
  /** Pair ids, in the order their left cards are shown. */
  leftOrder: string[];
  rightOrder: string[];
  matches: Match[];
  /** Per-match outcome once the answer has been marked. */
  results?: Array<Match & { correct: boolean }>;
  locale: Locale;
  readonly?: boolean;
  onChange: (matches: Match[]) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  /** The left card picked up, waiting for its partner. */
  const [heldId, setHeldId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const columnsRef = useRef<HTMLDivElement>(null);
  /** Every card on screen, so a line can be drawn between two of them. */
  const cardsRef = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<Line[]>([]);

  const pairById = (id: string) => pairs.find((pair) => pair.id === id);
  const nameOf = (side: Side) => side.label;
  const marked = results !== undefined;

  const matchOfLeft = (id: string) => matches.find((m) => m.leftId === id);
  const matchOfRight = (id: string) => matches.find((m) => m.rightId === id);
  const outcome = (match: Match | undefined) =>
    match &&
    results?.find(
      (r) => r.leftId === match.leftId && r.rightId === match.rightId,
    )?.correct;

  // Escape puts a held card down, the way every other pick-up does.
  useEffect(() => {
    if (heldId === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHeldId(null);
      setAnnouncement(translate(messages, "putDown", locale));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [heldId, locale]);

  /**
   * Where to draw each connection, measured from the cards themselves.
   *
   * A dashed border says a card is matched; it does not say to what, and with
   * six cards paired every one of them looks the same. The line is the only
   * thing that answers "which did I put with which" at a glance.
   *
   * Measured rather than calculated: the cards are as tall as their content,
   * so nothing about their positions is known in advance.
   */
  const measure = useCallback(() => {
    const container = columnsRef.current;
    if (!container) return setLines([]);
    const frame = container.getBoundingClientRect();

    const drawn: Line[] = [];
    for (const match of matches) {
      const from = cardsRef.current.get(`left:${match.leftId}`);
      const to = cardsRef.current.get(`right:${match.rightId}`);
      if (!from || !to) continue;

      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      // Stacked into one column — on a phone — the two cards overlap
      // horizontally and a line between them would cross the cards in
      // between. The number on each card carries the pairing there.
      if (b.left < a.right) return setLines([]);

      drawn.push({
        id: `${match.leftId}:${match.rightId}`,
        x1: a.right - frame.left,
        y1: a.top + a.height / 2 - frame.top,
        x2: b.left - frame.left,
        y2: b.top + b.height / 2 - frame.top,
        correct: outcome(match),
      });
    }
    setLines(drawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, results]);

  useLayoutEffect(() => {
    measure();

    // The cards move whenever they are re-laid-out — a narrower window, a
    // longer label wrapping to two lines — and every line is wrong the moment
    // they do. The observer catches both; the resize listener covers the
    // window alone, where there is no observer to be had.
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(onResize);
    if (observer && columnsRef.current) observer.observe(columnsRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [measure]);

  const separate = (match: Match) => {
    if (readonly) return;
    onChange(
      matches.filter(
        (m) => !(m.leftId === match.leftId && m.rightId === match.rightId),
      ),
    );
    setAnnouncement(
      t("unmatchedNow", {
        left: nameOf(pairById(match.leftId)!.left),
        right: nameOf(pairById(match.rightId)!.right),
      }),
    );
  };

  const pickUp = (id: string) => {
    if (readonly) return;
    const existing = matchOfLeft(id);
    // A matched card is separated rather than picked up: it already has a
    // partner, and choosing it plainly means undoing that.
    if (existing) {
      separate(existing);
      return;
    }
    const next = heldId === id ? null : id;
    setHeldId(next);
    setAnnouncement(
      next ? t("holding", { card: nameOf(pairById(id)!.left) }) : t("putDown"),
    );
  };

  const matchWith = (rightId: string) => {
    if (readonly) return;
    const existing = matchOfRight(rightId);

    // Chosen with empty hands, an already-matched card is being undone.
    if (existing && heldId === null) {
      separate(existing);
      return;
    }
    if (heldId === null) return;

    /*
     * Holding a card and choosing an occupied one means "put this here
     * instead". Only separating the old pair, and dropping what was being
     * held, would make the learner do the same thing twice — and reads as the
     * card having been refused.
     */
    const without = matches.filter(
      (m) => m.rightId !== rightId && m.leftId !== heldId,
    );
    onChange([...without, { leftId: heldId, rightId }]);
    setHeldId(null);
    setAnnouncement(
      t("matched", {
        left: nameOf(pairById(heldId)!.left),
        right: nameOf(pairById(rightId)!.right),
      }),
    );
  };

  const card = (side: Side, id: string, column: "left" | "right") => {
    const match = column === "left" ? matchOfLeft(id) : matchOfRight(id);
    // The pairing's number, shown on both of its cards. It survives the
    // columns stacking, where there is no room for a line, and it is a second
    // channel besides position for anyone who finds the lines hard to follow.
    const number = match ? matches.indexOf(match) + 1 : undefined;
    const partner = match
      ? column === "left"
        ? pairById(match.rightId)?.right
        : pairById(match.leftId)?.left
      : undefined;
    const right = outcome(match);

    const classes = ["bitflow-matching-card"];
    if (match) classes.push("bitflow-matching-card-matched");
    if (heldId === id && column === "left") {
      classes.push("bitflow-matching-card-held");
    }
    if (marked && match) {
      classes.push(
        right ? "bitflow-matching-card-correct" : "bitflow-matching-card-wrong",
      );
    }

    return (
      <li key={id}>
        <button
          type="button"
          ref={(node) => {
            const key = `${column}:${id}`;
            if (node) cardsRef.current.set(key, node);
            else cardsRef.current.delete(key);
          }}
          className={classes.join(" ")}
          disabled={readonly}
          aria-pressed={column === "left" ? heldId === id : undefined}
          aria-label={
            partner
              ? t("matchedWith", { card: nameOf(side), other: nameOf(partner) })
              : t("unmatched", { card: nameOf(side) })
          }
          onClick={() => (column === "left" ? pickUp(id) : matchWith(id))}
        >
          {number !== undefined && (
            <span className="bitflow-matching-index" aria-hidden="true">
              {number}
            </span>
          )}

          {side.kind === "image" && side.image?.src ? (
            <img
              className="bitflow-matching-image"
              src={side.image.src}
              alt=""
              draggable={false}
            />
          ) : (
            <span>{nameOf(side)}</span>
          )}

          {marked && match && (
            <span className="bitflow-visually-hidden">
              {" "}
              {t(right ? "matchRight" : "matchWrong")}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="bitflow-matching">
      <p className="bitflow-hint">{readonly ? t("howToReadonly") : t("howTo")}</p>

      <div className="bitflow-matching-columns" ref={columnsRef}>
        {/* Drawn over the columns and deaf to the pointer, so a line never
            becomes the thing being clicked. */}
        <svg className="bitflow-matching-lines" aria-hidden="true">
          {lines.map((line) => (
            <line
              key={line.id}
              className={
                line.correct === undefined
                  ? "bitflow-matching-line"
                  : `bitflow-matching-line bitflow-matching-line-${line.correct ? "correct" : "wrong"}`
              }
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </svg>

        <section>
          <h3 className="bitflow-label">{t("leftHeading")}</h3>
          <ul className="bitflow-matching-column">
            {leftOrder.map((id) => {
              const pair = pairById(id);
              return pair ? card(pair.left, id, "left") : null;
            })}
          </ul>
        </section>

        <section>
          <h3 className="bitflow-label">{t("rightHeading")}</h3>
          <ul className="bitflow-matching-column">
            {rightOrder.map((id) => {
              const pair = pairById(id);
              return pair ? card(pair.right, id, "right") : null;
            })}
          </ul>
        </section>
      </div>

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
