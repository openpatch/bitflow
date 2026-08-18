import { translate, type Locale } from "@bitflow/core";
import { BoxEditor, type Box } from "@bitflow/element";
import type { ReactElement } from "react";
import { formMessages } from "./formMessages";
import type { Data } from "./schema";

/** What the author has hold of: the two lists are edited on one picture. */
export type Target = { type: "zone" | "element"; id: string };

/**
 * The play area, authored by drawing on it.
 *
 * The gesture is `BoxEditor`'s; what a box means is this task's. Both lists
 * live on the same picture, so they are handed over as one list of boxes with
 * an id that says which they came from — a drop zone and a draggable are the
 * same rectangle to drag around and two very different things to the task.
 */
export const EditorCanvas = ({
  data,
  locale,
  selected,
  onSelect,
  onAddZone,
  onMoveZone,
  onMoveElement,
}: {
  data: Data;
  locale: Locale;
  selected?: Target;
  onSelect: (target: Target | undefined) => void;
  onAddZone: (box: Box) => void;
  onMoveZone: (id: string, box: Box) => void;
  onMoveElement: (id: string, box: Box) => void;
}): ReactElement => {
  const t = (key: string) => translate(formMessages, key, locale);

  const key = (target: Target) => `${target.type}:${target.id}`;
  const parse = (id: string): Target => {
    const [type, ...rest] = id.split(":");
    return { type: type as Target["type"], id: rest.join(":") };
  };

  return (
    <BoxEditor
      background={data.background}
      aspectRatio={`${data.size.width} / ${data.size.height}`}
      hint={t("canvasHint")}
      selectedId={selected && key(selected)}
      items={[
        ...data.dropZones.map((zone) => ({
          id: key({ type: "zone" as const, id: zone.id }),
          label: zone.label || zone.id,
          box: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
          className: "bitflow-dragdrop-handle-zone",
        })),
        ...data.elements.map((element) => ({
          id: key({ type: "element" as const, id: element.id }),
          label: element.label || element.id,
          box: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          },
          className: "bitflow-dragdrop-handle-element",
        })),
      ]}
      onSelect={(id) => onSelect(id ? parse(id) : undefined)}
      onDraw={onAddZone}
      onChange={(id, box) => {
        const target = parse(id);
        if (target.type === "zone") onMoveZone(target.id, box);
        else onMoveElement(target.id, box);
      }}
    />
  );
};
