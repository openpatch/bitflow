import { translate, type Locale } from "@bitflow/core";
import { useEffect, useState, type ReactElement } from "react";
import { messages } from "./messages";
import type { Match, Pair, Side } from "./schema";

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

      <div className="bitflow-matching-columns">
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
