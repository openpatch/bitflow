// @vitest-environment node
//
// Reads the packages' stylesheets off disk, so it needs Node rather than jsdom.
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every theme variable a stylesheet asks for has to exist.
 *
 * CSS answers an undefined custom property with nothing at all: the
 * declaration is dropped and the rule quietly does less than it says. A
 * mistyped or invented token therefore produces no error, no warning and no
 * visible clue beyond the thing not being the colour you expected — which is
 * how `--bitflow-color-accent`, a name the theme never had, ended up drawing
 * transparent marks in three packages.
 *
 * A `var(--x, fallback)` is exempt: supplying a fallback is how a component
 * declares its own local variable, and says so.
 */
describe("theme variables", () => {
  const root = resolve(import.meta.dirname, "../../..");

  const stylesheets = async (): Promise<string[]> => {
    const found: string[] = [];
    const walk = async (dir: string) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "dist") continue;
          await walk(path);
        } else if (entry.name.endsWith(".css")) {
          found.push(path);
        }
      }
    };
    await walk(join(root, "packages"));
    return found.sort();
  };

  const defined = async (): Promise<Set<string>> => {
    const theme = await readFile(
      join(root, "packages/bitflow-core/src/theme.css"),
      "utf8",
    );
    return new Set(
      [...theme.matchAll(/^\s*(--bitflow-[\w-]+)\s*:/gm)].map((m) => m[1]),
    );
  };

  it("finds the stylesheets it is meant to be checking", async () => {
    // A moved package must not turn this suite into a no-op.
    expect((await stylesheets()).length).toBeGreaterThanOrEqual(8);
  });

  it("defines every variable used without a fallback", async () => {
    const known = await defined();
    const missing: string[] = [];

    for (const file of await stylesheets()) {
      const css = await readFile(file, "utf8");
      for (const match of css.matchAll(/var\(\s*(--bitflow-[\w-]+)\s*(,)?/g)) {
        const [, name, hasFallback] = match;
        if (!known.has(name) && !hasFallback) {
          missing.push(`${relative(root, file)}: ${name}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
