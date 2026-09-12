// @vitest-environment node
//
// Reads the gallery's `llms.txt` off disk: the point is what is *in* it.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KNOWN_BIT_TYPES } from "./bitLoaders";

/**
 * `platforms/web/public/llms.txt` tells an agent how to write a `.bitflow`
 * file, and the bulk of it is a section per bit. A bit added without a section
 * is a bit no agent will ever emit, and nothing else would say so — the file is
 * prose, so it builds and ships either way.
 *
 * This checks the one thing that can be checked mechanically: that the set of
 * bits the file documents is the set of bits that exist. Whether each section
 * is *right* is still down to reading it.
 */
describe("llms.txt", () => {
  const root = resolve(import.meta.dirname, "../../..");
  const read = () => readFile(resolve(root, "platforms/web/public/llms.txt"), "utf8");

  /** Every `### <type> — "Name"` heading, which is how a bit's section opens. */
  const documented = (source: string): string[] =>
    [...source.matchAll(/^### ([a-z-]+) —/gm)].map((match) => match[1]);

  it("has a section for every bit", async () => {
    expect(documented(await read()).sort()).toEqual([...KNOWN_BIT_TYPES].sort());
  });

  it("links only sample flows the gallery actually serves", async () => {
    const source = await read();
    for (const name of ["minimal", "adaptive", "all-initial-bits"]) {
      expect(source).toContain(`/${name}.bitflow`);
      await expect(
        readFile(resolve(root, `platforms/web/public/${name}.bitflow`), "utf8"),
      ).resolves.toBeTruthy();
    }
  });
});
