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

/**
 * A one-line preview of a node's content for the canvas.
 *
 * Bits do not declare which field is their "title", and requiring them to
 * would be another thing every bit has to get right. Taking the first
 * non-trivial string is good enough for a label and costs a bit nothing.
 */
export const summarise = (data: Record<string, unknown>): string => {
  for (const key of ["title", "instruction", "text", "markdown", "prompt", "name"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return firstLine(value);
    }
  }
  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.trim()) return firstLine(value);
  }
  return "";
};

const firstLine = (value: string): string => {
  const line = value.trim().split("\n")[0];
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
};
