import { translate, type Locale } from "@bitflow/core";
import { usePointerDrag } from "@bitflow/element";
import { useCallback, useRef, useState, type ReactElement } from "react";
import { regionBox } from "./geometry";
import { formMessages } from "./formMessages";
import type { Data, Region } from "./schema";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Below this a drag is a click, not a region worth having. */
const SMALLEST = 0.02;

/**
 * The author's view of the picture: the regions, drawn on it.
 *
 * Drawn on rather than typed at — drag on the background to make a region,
 * drag one to move it. The numeric fields in the form below stay for anyone
 * without a pointer, and are the same numbers.
 */
export const RegionCanvas = ({
  data,
  locale,
  selectedId,
  onSelect,
  onDraw,
  onMove,
}: {
  data: Data;
  locale: Locale;
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onDraw: (box: { x: number; y: number; width: number; height: number }) => void;
  onMove: (id: string, at: { x: number; y: number }) => void;
}): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);
  const pictureRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >();
  /** Where the gesture began, and what it is doing. */
  const gesture = useRef<
    | { kind: "draw"; fromX: number; fromY: number }
    | { kind: "move"; id: string; grabX: number; grabY: number }
    | undefined
  >(undefined);

  const toFractions = useCallback((clientX: number, clientY: number) => {
    const box = pictureRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return null;
    return {
      x: clamp((clientX - box.left) / box.width),
      y: clamp((clientY - box.top) / box.height),
    };
  }, []);

  usePointerDrag(
    (event) => {
      const current = gesture.current;
      if (!current) return;
      const at = toFractions(event.clientX, event.clientY);
      if (!at) return;

      if (current.kind === "draw") {
        // Measured from where the drag began, not from the last event: per-step
        // deltas mean a slow drag never passes a threshold.
        setDrawing({
          x: Math.min(current.fromX, at.x),
          y: Math.min(current.fromY, at.y),
          width: Math.abs(at.x - current.fromX),
          height: Math.abs(at.y - current.fromY),
        });
        return;
      }
      onMove(current.id, {
        x: clamp(at.x - current.grabX),
        y: clamp(at.y - current.grabY),
      });
    },
    () => {
      const current = gesture.current;
      gesture.current = undefined;
      const box = drawing;
      setDrawing(undefined);
      if (current?.kind !== "draw" || !box) return;
      if (box.width < SMALLEST || box.height < SMALLEST) return;
      onDraw(box);
    },
  );

  return (
    <div
      className="bitflow-annotate-picture bitflow-annotate-editor"
      ref={pictureRef}
      style={{ aspectRatio: `${data.size.width} / ${data.size.height}` }}
      onPointerDown={(event) => {
        const at = toFractions(event.clientX, event.clientY);
        if (!at) return;
        gesture.current = { kind: "draw", fromX: at.x, fromY: at.y };
        onSelect(undefined);
      }}
    >
      {data.background.src ? (
        <img
          className="bitflow-annotate-image"
          src={data.background.src}
          alt={data.background.alt}
          draggable={false}
        />
      ) : (
        <div className="bitflow-annotate-image bitflow-annotate-noimage" />
      )}

      {data.regions.map((region) => {
        const box = regionBox(region);
        return (
          <button
            type="button"
            key={region.id}
            className={
              selectedId === region.id
                ? "bitflow-annotate-region bitflow-annotate-region-selected"
                : "bitflow-annotate-region"
            }
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
              borderRadius: region.kind === "circle" ? "50%" : undefined,
            }}
            aria-pressed={selectedId === region.id}
            onPointerDown={(event) => {
              // Stops the picture beneath from starting a new region.
              event.stopPropagation();
              const at = toFractions(event.clientX, event.clientY);
              if (!at) return;
              gesture.current = {
                kind: "move",
                id: region.id,
                grabX: at.x - box.x,
                grabY: at.y - box.y,
              };
              onSelect(region.id);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="bitflow-annotate-region-name">
              {region.label || t("unnamedRegion")}
            </span>
          </button>
        );
      })}

      {drawing && (
        <span
          className="bitflow-annotate-region bitflow-annotate-drawing"
          aria-hidden="true"
          style={{
            left: `${drawing.x * 100}%`,
            top: `${drawing.y * 100}%`,
            width: `${drawing.width * 100}%`,
            height: `${drawing.height * 100}%`,
          }}
        />
      )}
    </div>
  );
};

/** A region from a drawn box: a circle takes the middle and half the width. */
export const regionFrom = (
  id: string,
  box: { x: number; y: number; width: number; height: number },
  kind: Region["kind"],
): Region =>
  kind === "circle"
    ? {
        id,
        kind,
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        radius: Math.max(0.01, Math.min(box.width, box.height) / 2),
        width: box.width,
        height: box.height,
        label: "",
        acceptedLabels: [],
      }
    : {
        id,
        kind,
        x: box.x,
        y: box.y,
        radius: 0.05,
        width: box.width,
        height: box.height,
        label: "",
        acceptedLabels: [],
      };
