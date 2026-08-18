// @vitest-environment node
//
// Reads every catalog off disk: importing them would only prove the packages
// build, and the point is what is *in* them.
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A locale is either supported or absent — never half-present.
 *
 * `translate` falls back to English for a missing key, silently, which is the
 * right runtime behaviour and a terrible authoring guarantee: it let two
 * catalogs claim eight languages while filling two, so a French learner read a
 * French question wrapped in English chrome and nothing ever complained. The
 * fix was to split catalogs by audience rather than to translate more; this
 * test is what stops them merging back.
 *
 * Adding a locale to a catalog therefore means translating every key in it. If
 * that is too much, the honest move is not to list the locale.
 */
describe("message catalogs", () => {
  const root = resolve(import.meta.dirname, "../../..");

  /** Every `*essages.ts` under `packages/`, whatever it is called. */
  const catalogFiles = async (): Promise<string[]> => {
    const found: string[] = [];
    const walk = async (dir: string) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "dist") continue;
          await walk(path);
        } else if (/[Mm]essages\.ts$/.test(entry.name)) {
          found.push(path);
        }
      }
    };
    await walk(join(root, "packages"));
    return found.sort();
  };

  /** locale → its keys, read from the source rather than from a build. */
  const localesIn = (source: string): Map<string, string[]> => {
    const locales = new Map<string, string[]>();
    for (const [, locale, body] of source.matchAll(
      /^ {2}([a-z]{2}): \{$(.*?)^ {2}\},$/gms,
    )) {
      locales.set(locale, [...body.matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]));
    }
    return locales;
  };

  /**
   * The files that translate against one catalog: its siblings that import it.
   * A catalog and its callers always live in the same directory here, and
   * `t` is bound to whichever catalog the file imported.
   */
  const usersOf = async (catalogFile: string): Promise<string[]> => {
    const dir = dirname(catalogFile);
    const name = basename(catalogFile, ".ts");
    const users: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
      if (entry.name.includes(".test.")) continue;
      const path = join(dir, entry.name);
      const source = await readFile(path, "utf8");
      if (new RegExp(`from "\\./${name}"`).test(source)) users.push(path);
    }
    return users;
  };

  it("finds the catalogs it is meant to be checking", async () => {
    const files = await catalogFiles();
    // A rename or a moved package must not turn this suite into a no-op.
    expect(files.length).toBeGreaterThanOrEqual(12);
  });

  it("fills every locale it declares", async () => {
    const gaps: string[] = [];

    for (const file of await catalogFiles()) {
      const locales = localesIn(await readFile(file, "utf8"));
      const english = locales.get("en");
      if (!english) continue;

      for (const [locale, keys] of locales) {
        const missing = english.filter((key) => !keys.includes(key));
        if (missing.length > 0) {
          gaps.push(`${relative(root, file)} [${locale}]: ${missing.join(", ")}`);
        }
      }
    }

    expect(gaps).toEqual([]);
  });

  it("has every key the code asks for", async () => {
    // `translate` falls back to the key itself when it finds nothing, so a
    // missing key renders as `save` rather than "Save" — visible only to
    // whoever happens to look at that screen. Splitting a catalog is exactly
    // when this happens.
    //
    // Checked against the union of the catalogs a file imports, because a file
    // may hold two: a bit's views render learner strings and authoring labels
    // side by side. Which `t` is bound to which is not worth parsing — the
    // bug being caught is a key that resolves to nothing at all.
    const missing: string[] = [];
    const catalogs = new Map<string, Set<string>>();

    for (const file of await catalogFiles()) {
      catalogs.set(
        file,
        new Set(localesIn(await readFile(file, "utf8")).get("en") ?? []),
      );
    }

    /** Every key in scope for one source file. */
    const inScope = async (user: string): Promise<Set<string>> => {
      const keys = new Set<string>();
      for (const [file, catalog] of catalogs) {
        if ((await usersOf(file)).includes(user)) {
          for (const key of catalog) keys.add(key);
        }
      }
      return keys;
    };

    const users = new Set<string>();
    for (const file of catalogs.keys()) {
      for (const user of await usersOf(file)) users.add(user);
    }

    for (const user of users) {
      const known = await inScope(user);
      if (known.size === 0) continue;
      const source = await readFile(user, "utf8");
      for (const [, key] of source.matchAll(/\bt\(\s*"(\w+)"/g)) {
        if (!known.has(key)) missing.push(`${relative(root, user)}: ${key}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it("has no key in a locale that English does not have", async () => {
    const strays: string[] = [];

    for (const file of await catalogFiles()) {
      const locales = localesIn(await readFile(file, "utf8"));
      const english = locales.get("en");
      if (!english) continue;

      for (const [locale, keys] of locales) {
        // A key only a translation has is a key nothing reads — usually a
        // rename that was applied to English alone.
        const extra = keys.filter((key) => !english.includes(key));
        if (extra.length > 0) {
          strays.push(`${relative(root, file)} [${locale}]: ${extra.join(", ")}`);
        }
      }
    }

    expect(strays).toEqual([]);
  });
});
