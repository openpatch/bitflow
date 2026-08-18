import { translate, type Locale } from "@bitflow/core";
import { BoxEditor, type Box } from "@bitflow/element";
import type { ReactElement } from "react";
import { formMessages } from "./formMessages";
import type { Data } from "./schema";

/**
 * The picture, authored by drawing on it.
 *
 * The gesture is `BoxEditor`'s; what a box means is this task's. Regions are
 * invisible to a learner and outlined here, and the one to find is coloured so
 * it can be told from the decoys at a glance.
 */
export const HotspotCanvas = ({
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
  onDraw: (box: Box) => void;
  onMove: (id: string, box: Box) => void;
}): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);

  return (
    <BoxEditor
      background={data.background}
      aspectRatio={`${data.size.width} / ${data.size.height}`}
      hint={t("canvasHint")}
      selectedId={selectedId}
      items={data.hotspots.map((hotspot) => ({
        id: hotspot.id,
        label: hotspot.label || t("unnamedRegion"),
        box: {
          x: hotspot.x,
          y: hotspot.y,
          width: hotspot.width,
          height: hotspot.height,
        },
        ellipse: hotspot.shape === "ellipse",
        className: hotspot.correct ? "bitflow-hotspots-handle-correct" : undefined,
      }))}
      onSelect={onSelect}
      onDraw={onDraw}
      onChange={onMove}
    />
  );
};
