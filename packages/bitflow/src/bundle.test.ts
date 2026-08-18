// @vitest-environment node
//
// Reads the package's own source off disk, so it needs Node rather than jsdom.
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The learner runtime must not reach into the editor.
 *
 * `<bitflow-flow>` is meant to be cheap to embed — 29 kB against the editor's
 * 287 kB — and the whole difference is `@xyflow/react`. One import of a helper
 * that happens to live in an editor module undoes that, silently, and only a
 * bundle inspection would show it. This is that inspection, run against the
 * import graph so it needs no build.
 */
describe("the learner bundle", () => {
  const source = resolve(import.meta.dirname);

  /** Every module `./index` pulls in, followed transitively, keyed by filename. */
  const learnerModules = async (): Promise<Map<string, string>> => {
    const seen = new Map<string, string>();
    const queue = ["index.ts"];

    while (queue.length > 0) {
      const specifier = queue.shift()!;
      const found = await readSource(resolve(source, specifier));
      if (found === null || seen.has(found.file)) continue;
      seen.set(found.file, found.contents);

      for (const match of found.contents.matchAll(/from "\.\/([^"]+)"/g)) {
        queue.push(match[1]);
      }
    }
    return seen;
  };

  /** Resolves an extensionless relative import the way the bundler would. */
  const readSource = async (
    path: string,
  ): Promise<{ file: string; contents: string } | null> => {
    for (const candidate of [path, `${path}.ts`, `${path}.tsx`]) {
      try {
        const contents = await readFile(candidate, "utf8");
        return { file: basename(candidate), contents };
      } catch {
        continue;
      }
    }
    return null;
  };

  /** Only real imports count — the package talks about `@xyflow/react` in comments. */
  const imports = (contents: string, specifier: string): boolean =>
    new RegExp(`(?:from|import)\\s+"${specifier}"`).test(contents);

  it("never reaches @xyflow/react", async () => {
    const modules = await learnerModules();
    expect(modules.size).toBeGreaterThan(3);

    const offenders = [...modules]
      .filter(([, contents]) => imports(contents, "@xyflow/react"))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });

  it("never reaches the editor, which is where @xyflow/react gets in", async () => {
    const modules = await learnerModules();
    const editorOnly = ["FlowEditor", "EditorNode", "editorStore", "ConditionEditor"];

    for (const [file, contents] of modules) {
      for (const name of editorOnly) {
        expect(
          imports(contents, `\\./${name}`),
          `${file} must not import ${name}`,
        ).toBe(false);
      }
    }
  });

  it("still includes what the learner actually needs", async () => {
    const modules = await learnerModules();
    for (const file of ["Flow.tsx", "flowStore.ts", "Shell.tsx", "Countdown.tsx"]) {
      expect([...modules.keys()]).toContain(file);
    }
  });
});
