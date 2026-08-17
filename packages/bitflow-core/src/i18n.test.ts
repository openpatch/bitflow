import { describe, expect, it } from "vitest";
import {
  createTranslator,
  formatDate,
  formatDuration,
  interpolate,
  resolveLocale,
  translate,
  type Catalogs,
} from "./i18n";

const catalogs: Catalogs = {
  en: { hello: "Hello", tries: "{count} of {max} tries" },
  de: { hello: "Hallo" },
};

describe("resolveLocale", () => {
  it("accepts a supported locale", () => {
    expect(resolveLocale("de")).toBe("de");
  });

  it("narrows a regional tag to its base language", () => {
    expect(resolveLocale("de-AT")).toBe("de");
    expect(resolveLocale("pt-BR")).toBe("pt");
  });

  it("falls back to English for anything unsupported or absent", () => {
    expect(resolveLocale("ja")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale(null)).toBe("en");
  });

  it("honours an explicit fallback", () => {
    expect(resolveLocale("ja", "de")).toBe("de");
  });
});

describe("interpolate", () => {
  it("substitutes named variables", () => {
    expect(interpolate("{count} of {max}", { count: 1, max: 3 })).toBe("1 of 3");
  });

  it("leaves an unsupplied placeholder visible", () => {
    expect(interpolate("{count} of {max}", { count: 1 })).toBe("1 of {max}");
  });
});

describe("translate", () => {
  it("uses the requested locale", () => {
    expect(translate(catalogs, "hello", "de")).toBe("Hallo");
  });

  it("falls back to English for an untranslated key", () => {
    expect(translate(catalogs, "tries", "de", { count: 1, max: 3 })).toBe(
      "1 of 3 tries",
    );
  });

  it("falls back to the key itself when nothing has it", () => {
    expect(translate(catalogs, "missing.key", "de")).toBe("missing.key");
  });

  it("binds catalogs and locale once via createTranslator", () => {
    const t = createTranslator(catalogs, "de-AT");
    expect(t("hello")).toBe("Hallo");
  });
});

describe("dates", () => {
  it("formats a date in the requested locale", () => {
    const date = new Date("2026-03-04T12:00:00.000Z");
    expect(formatDate(date, "de", { dateStyle: "short", timeZone: "UTC" })).toBe(
      "04.03.26",
    );
    expect(formatDate(date, "en", { dateStyle: "short", timeZone: "UTC" })).toBe(
      "3/4/26",
    );
  });

  it("formats durations as minutes and seconds, adding hours only when needed", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(64_000)).toBe("1:04");
    expect(formatDuration(7_264_000)).toBe("2:01:04");
  });

  it("clamps a negative duration to zero", () => {
    expect(formatDuration(-500)).toBe("0:00");
  });
});
