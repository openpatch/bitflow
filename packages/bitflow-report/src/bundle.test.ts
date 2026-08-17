import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The acceptance matrix requires that a page embedding only a report does not
 * download the editor, `@xyflow/react` or any bit package.
 *
 * The guarantee is really about the import graph, so that is what this checks —
 * against the package's own source, which needs no prior build and cannot pass
 * because of a stale `dist`.
 */
describe("report bundle isolation", () => {
  const source = resolve(import.meta.dirname);

  const files = [
    "index.ts",
    "Report.tsx",
    "GroupReport.tsx",
    "report.ts",
    "group.ts",
    "stats.ts",
    "messages.ts",
  ];

  it("imports nothing from the flow, the editor or a bit", async () => {
    const forbidden = [
      "@xyflow/react",
      "@bitflow/bitflow",
      "@bitflow/element",
      "@bitflow/task-",
      "@bitflow/start-",
      "@bitflow/end-",
      "@bitflow/title-",
      "@bitflow/input-",
      "zustand",
      "zundo",
    ];

    for (const file of files) {
      const contents = await readFile(resolve(source, file), "utf8");
      for (const name of forbidden) {
        expect(
          contents.includes(`"${name}`),
          `${file} must not import ${name}`,
        ).toBe(false);
      }
    }
  });

  it("depends on nothing but core and zod", async () => {
    const manifest = JSON.parse(
      await readFile(resolve(source, "..", "package.json"), "utf8"),
    );
    expect(Object.keys(manifest.dependencies).sort()).toEqual([
      "@bitflow/core",
      "zod",
    ]);
  });
});
