/**
 * A one-line preview of a node's content.
 *
 * Bits do not declare which field is their "title", and requiring them to would
 * be another thing every bit has to get right. Taking the first non-trivial
 * string is good enough to label a node on the canvas or to announce a step to
 * a screen reader, and costs a bit nothing.
 *
 * Its own module because both the editor canvas and the learner runtime use it,
 * and the runtime must not reach into the editor — that would pull
 * `@xyflow/react` into the learner bundle.
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
