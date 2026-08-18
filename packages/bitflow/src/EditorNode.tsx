import { getBit, resolveLocale, type Locale } from "@bitflow/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ReactElement } from "react";

export type EditorNodeData = {
  bitType: string;
  locale: Locale;
  /** Set when this node has validation problems, so the canvas can show it. */
  invalid?: boolean;
  /** First line of the node's own content, for recognising it at a glance. */
  summary?: string;
};

/**
 * One step on the canvas.
 *
 * Shows the bit's own name and a snippet of its content rather than the raw
 * type, so an author scanning a large flow reads "Choice — Which are prime?"
 * instead of "task-choice".
 */
export const EditorNode = ({
  data,
  selected,
}: NodeProps & { data: EditorNodeData }): ReactElement => {
  const bit = getBit(data.bitType);
  const kind = bit?.kind ?? "content";
  const info = bit?.info(resolveLocale(data.locale));

  return (
    <div
      className={[
        "bitflow-node",
        `bitflow-node-${kind}`,
        data.invalid ? "bitflow-node-invalid" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-selected={selected}
    >
      {kind !== "start" && <Handle type="target" position={Position.Top} />}
      <div className="bitflow-node-kind">{info?.name ?? data.bitType}</div>
      <div className="bitflow-node-title" title={data.summary}>
        {data.summary || " "}
      </div>
      {kind !== "end" && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
};

export const nodeTypes = { bit: EditorNode };

export { summarise } from "./summarise";

