import { scaledSize } from "@bitflow/core";

export type ReadImageOptions = {
  /** Longest edge, in pixels, after scaling. */
  maxEdge?: number;
  /** JPEG quality, 0–1. Ignored for the formats that keep their own. */
  quality?: number;
};

/** What the form defaults to: big enough to project, small enough to email. */
export const DEFAULT_MAX_EDGE = 1600;
export const DEFAULT_QUALITY = 0.82;

/**
 * Turns a chosen file into a `data:` URI, scaled and re-encoded on the way.
 *
 * A phone photograph is four thousand pixels across and eight megabytes; the
 * same picture behind a drag-and-drop task is shown at eight hundred. Storing
 * the original would put those megabytes into every copy of the document —
 * mailed, synced, versioned — for no visible difference. So it is drawn once
 * at the size it will be seen at and encoded from there.
 */
export const readImageFile = async (
  file: File,
  { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY }: ReadImageOptions = {},
): Promise<string> => {
  /*
   * Refused before decoding rather than after. `accept` filters the file
   * picker and nothing else — a file can still arrive by drag, by paste, or
   * misnamed — and a decoder handed something that is not an image may simply
   * never answer, leaving the form waiting for a picture that is not coming.
   */
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not a picture.");
  }

  // SVG is already small, already scalable, and rasterising it would throw
  // both away. It goes in as it came.
  if (file.type === "image/svg+xml") return await asDataUri(file);

  const bitmap = await decode(file);
  const size = scaledSize(bitmap.width, bitmap.height, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    // No canvas to draw on — an unusual browser, or a locked-down one. The
    // picture is worth more than the saving.
    return await asDataUri(file);
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height);

  const type = hasTransparency(context, size) ? "image/png" : "image/jpeg";
  const encoded = canvas.toDataURL(type, quality);

  // Re-encoding is not guaranteed to help: a small PNG of flat colour can come
  // out of the JPEG encoder larger than it went in. Keep whichever is smaller,
  // as long as the original did not need scaling.
  if (size.width === bitmap.width && size.height === bitmap.height) {
    const original = await asDataUri(file);
    return original.length <= encoded.length ? original : encoded;
  }
  return encoded;
};

/**
 * Whether any pixel is see-through, which decides PNG against JPEG.
 *
 * JPEG has no alpha channel: encoding a logo with a transparent background as
 * one turns the background black. Worth a pass over the pixels to avoid.
 */
const hasTransparency = (
  context: CanvasRenderingContext2D,
  size: { width: number; height: number },
): boolean => {
  const { data } = context.getImageData(0, 0, size.width, size.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
};

/** Decodes a file into something drawable, preferring the cheaper path. */
const decode = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Falls through: some browsers refuse formats they will still render.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The file could not be read as an image."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** The file's own bytes, base64-encoded, unchanged. */
const asDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
