import { z } from "zod";

/**
 * A picture, carried inside the document rather than linked from it.
 *
 * `.bitflow` files are moved around — mailed between teachers, dropped into a
 * VLE, opened from a memory stick, taken offline — and a linked image breaks
 * on every one of those journeys, usually in front of a class. Embedding costs
 * file size, which the authoring form spends deliberately by scaling and
 * re-encoding what it is given.
 */
export const ImageSchema = z.object({
  /**
   * A `data:` URI. A plain URL still parses, because documents written before
   * this existed have to keep working, but the editor no longer produces one
   * and warns where it finds one.
   */
  src: z.string().default(""),
  /**
   * What the picture shows. Required wherever the picture carries meaning —
   * each task decides that for itself, because a decorative image is a real
   * thing too.
   */
  alt: z.string().default(""),
});
export type Image = z.infer<typeof ImageSchema>;

/** Whether a source is embedded in the document rather than fetched. */
export const isEmbedded = (src: string): boolean => src.startsWith("data:");

/**
 * Roughly how many bytes a `data:` URI costs in the saved file.
 *
 * The base64 payload is 4 characters per 3 bytes, and the JSON that carries it
 * stores those characters one byte each — so the string length *is* the cost,
 * which is the number an author needs when deciding whether a picture is worth
 * it. Anything that is not a data URI costs only its own length.
 */
export const sourceBytes = (src: string): number => src.length;

/** `1.4 MB`, for telling an author what a picture is costing them. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * The size a picture is scaled to: never enlarged, never longer than
 * `maxEdge` on its longest side.
 *
 * A phone photograph is 4000px across and a drag-and-drop background is shown
 * at perhaps 800. Storing the original would put megabytes into every copy of
 * the file to no visible effect.
 */
export const scaledSize = (
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } => {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const factor = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
};
