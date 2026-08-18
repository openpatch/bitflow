import { translate, type Locale } from "@bitflow/core";
import { useEffect, useState, type ReactElement } from "react";
import { messages } from "./messages";
import type { Data, Item, Placement, Zone, ZoneState } from "./schema";

/**
 * The image, its regions, and the labels waiting to go on it.
 *
 * One interaction, not two: pick a label up, then put it on a region. A mouse
 * does that with two clicks, a finger with two taps, a keyboard with two
 * Enters — so there is no "accessible alternative" running behind the real
 * thing and quietly rotting.
 *
 * Native HTML drag-and-drop is deliberately absent. It does not fire on touch,
 * it cannot be driven from a keyboard at all, and supporting it would have
 * meant building exactly this as a fallback beside it. A held-pointer drag
 * gesture is not implemented either: it would be a third code path to the same
 * `place()` call, and the two it would serve — mouse and stylus — are already
 * served. The task type keeps its name because that is what teachers call it.
 */
export const Board = ({
  data,
  placements,
  states,
  locale,
  readonly,
  onChange,
}: {
  data: Data;
  placements: Placement[];
  /** Per-zone outcome once the answer has been checked. */
  states?: Record<string, ZoneState>;
  locale: Locale;
  readonly?: boolean;
  onChange: (placements: Placement[]) => void;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  /** The label currently picked up, if any. */
  const [heldId, setHeldId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const itemById = (id: string): Item | undefined =>
    data.items.find((item) => item.id === id);
  const contentsOf = (zoneId: string): Placement[] =>
    placements.filter((placement) => placement.zoneId === zoneId);

  /**
   * What is still available to pick up. With reuse on that is everything —
   * a label that may fill several regions has to stay reachable after the
   * first one.
   */
  const available = data.allowMultiplePlacements
    ? data.items
    : data.items.filter(
        (item) => !placements.some((placement) => placement.itemId === item.id),
      );

  const nameOf = (item: Item) => item.label || item.id;
  const nameOfZone = (zone: Zone) => zone.label || zone.id;
  const labelOf = (placement: Placement) => {
    const item = itemById(placement.itemId);
    return item ? nameOf(item) : placement.itemId;
  };

  const pickUp = (item: Item) => {
    if (readonly) return;
    const next = heldId === item.id ? null : item.id;
    setHeldId(next);
    setAnnouncement(next ? t("holding", { item: nameOf(item) }) : t("putDown"));
  };

  const place = (zone: Zone) => {
    if (readonly || heldId === null) return;
    const item = itemById(heldId);
    if (!item) return;

    // With reuse off a label lives in exactly one place, so putting it down
    // takes it out of wherever it was.
    const without = data.allowMultiplePlacements
      ? placements.filter(
          (placement) =>
            !(placement.itemId === heldId && placement.zoneId === zone.id),
        )
      : placements.filter((placement) => placement.itemId !== heldId);

    onChange([...without, { itemId: heldId, zoneId: zone.id }]);
    setHeldId(null);
    setAnnouncement(t("placed", { item: nameOf(item), zone: nameOfZone(zone) }));
  };

  /** Clicking a full region with empty hands takes the last label back. */
  const takeBack = (zone: Zone) => {
    if (readonly) return;
    const contents = contentsOf(zone.id);
    const last = contents[contents.length - 1];
    if (!last) return;

    onChange(
      placements.filter(
        (placement) =>
          !(placement.itemId === last.itemId && placement.zoneId === last.zoneId),
      ),
    );
    setAnnouncement(t("removed", { item: labelOf(last), zone: nameOfZone(zone) }));
  };

  // Escape puts the label down, the way every other pick-up interaction does.
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

  return (
    <div className="bitflow-dragdrop">
      <div className="bitflow-dragdrop-image">
        {data.background.src ? (
          <img src={data.background.src} alt={data.background.alt} />
        ) : (
          <div className="bitflow-dragdrop-noimage" />
        )}

        {data.zones.map((zone) => {
          const contents = contentsOf(zone.id);
          const state = states?.[zone.id];
          const filled = contents.length > 0;

          return (
            <button
              key={zone.id}
              type="button"
              className={
                state && state !== "neutral"
                  ? `bitflow-dragdrop-zone bitflow-dragdrop-zone-${state}`
                  : "bitflow-dragdrop-zone"
              }
              style={{
                left: `${zone.rect.x * 100}%`,
                top: `${zone.rect.y * 100}%`,
                width: `${zone.rect.width * 100}%`,
                height: `${zone.rect.height * 100}%`,
              }}
              disabled={readonly}
              /*
               * The region's name and what is in it. Someone tabbing the
               * regions hears the state of the board without seeing it, which
               * is the whole task.
               */
              aria-label={
                filled
                  ? t("filledZone", {
                      zone: nameOfZone(zone),
                      items: contents.map(labelOf).join(", "),
                    })
                  : t("emptyZone", { zone: nameOfZone(zone) })
              }
              onClick={() => (heldId !== null ? place(zone) : takeBack(zone))}
            >
              <span className="bitflow-dragdrop-zone-contents" aria-hidden="true">
                {contents.map((placement) => {
                  const item = itemById(placement.itemId);
                  return (
                    <span key={placement.itemId} className="bitflow-dragdrop-placed">
                      {item?.kind === "image" && item.src ? (
                        <img src={item.src} alt="" />
                      ) : (
                        labelOf(placement)
                      )}
                    </span>
                  );
                })}
              </span>
              {state && state !== "neutral" && (
                <span className="bitflow-visually-hidden">{t(`zone-${state}`)}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bitflow-dragdrop-tray">
        <p className="bitflow-hint" id="bitflow-dragdrop-how">
          {readonly ? t("howToReadonly") : t("howTo")}
        </p>
        <ul className="bitflow-dragdrop-items">
          {available.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  heldId === item.id
                    ? "bitflow-dragdrop-item bitflow-dragdrop-item-held"
                    : "bitflow-dragdrop-item"
                }
                disabled={readonly}
                aria-pressed={heldId === item.id}
                aria-describedby="bitflow-dragdrop-how"
                onClick={() => pickUp(item)}
              >
                {item.kind === "image" && item.src ? (
                  <img src={item.src} alt={nameOf(item)} />
                ) : (
                  nameOf(item)
                )}
              </button>
            </li>
          ))}
          {available.length === 0 && (
            <li className="bitflow-text-muted">{t("trayEmpty")}</li>
          )}
        </ul>
      </div>

      <div className="bitflow-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
};
