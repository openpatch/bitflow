import { describe, expect, it } from "vitest";
import { formatBytes, ImageSchema, isEmbedded, scaledSize, sourceBytes } from "./image";

describe("scaledSize", () => {
  it("leaves a picture that already fits alone", () => {
    expect(scaledSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it("never enlarges a small picture", () => {
    // Scaling up would add bytes and no detail.
    expect(scaledSize(120, 90, 1600)).toEqual({ width: 120, height: 90 });
  });

  it("caps the longest edge, whichever it is", () => {
    expect(scaledSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(scaledSize(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("keeps the shape", () => {
    const { width, height } = scaledSize(1920, 1080, 800);
    expect(width / height).toBeCloseTo(1920 / 1080, 3);
  });

  it("never rounds an edge away to nothing", () => {
    // A panorama scaled hard would otherwise end up zero pixels tall, and a
    // zero-sized canvas encodes to nothing at all.
    expect(scaledSize(10000, 3, 100).height).toBe(1);
  });

  it("survives a picture with no size", () => {
    expect(scaledSize(0, 0, 1600)).toEqual({ width: 0, height: 0 });
  });
});

describe("isEmbedded", () => {
  it("knows a picture that travels with the document", () => {
    expect(isEmbedded("data:image/png;base64,AAAA")).toBe(true);
  });

  it("knows one that does not", () => {
    expect(isEmbedded("https://example.org/cpu.png")).toBe(false);
    expect(isEmbedded("/images/cpu.png")).toBe(false);
    expect(isEmbedded("")).toBe(false);
  });
});

describe("sourceBytes", () => {
  it("counts what the picture costs in the saved file", () => {
    // The base64 characters are stored one byte each, so the string length is
    // the cost — which is the number an author is deciding about.
    expect(sourceBytes("data:image/png;base64,AAAA")).toBe(26);
  });
});

describe("formatBytes", () => {
  it("reads the way a person would say it", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 kB");
    expect(formatBytes(1024 * 1024 * 1.44)).toBe("1.4 MB");
  });
});

describe("ImageSchema", () => {
  it("fills in a document that has no picture", () => {
    expect(ImageSchema.parse({})).toEqual({ src: "", alt: "" });
  });

  it("still accepts a linked picture, so old documents keep working", () => {
    const parsed = ImageSchema.parse({ src: "/cpu.png", alt: "A CPU" });
    expect(parsed.src).toBe("/cpu.png");
  });
});
