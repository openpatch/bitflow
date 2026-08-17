import { LOCALES, type Locale } from "./schema";

export const DEFAULT_LOCALE: Locale = "en";

/** Flat key → message. One JSON file per locale, per package. */
export type Catalog = Record<string, string>;
export type Catalogs = Partial<Record<Locale, Catalog>> & { en: Catalog };

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/**
 * Picks the closest supported locale. Accepts full BCP-47 tags, so `"de-AT"`
 * and `navigator.language` work without the caller trimming them first.
 */
export const resolveLocale = (
  requested?: string | null,
  fallback: Locale = DEFAULT_LOCALE,
): Locale => {
  if (!requested) return fallback;
  if (isLocale(requested)) return requested;
  const base = requested.split("-")[0]?.toLowerCase();
  return isLocale(base) ? base : fallback;
};

/**
 * Substitutes `{name}` placeholders. Missing variables are left as-is rather
 * than blanked, because a visible `{count}` in the UI is a far louder bug
 * report than an empty gap.
 */
export const interpolate = (
  message: string,
  vars?: Record<string, string | number>,
): string => {
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
};

/**
 * Looks a key up in `locale`, falling back to English and finally to the key
 * itself — an untranslated string still renders something the reader can act
 * on, which is what the old `@vocab` build step guaranteed at compile time.
 */
export const translate = (
  catalogs: Catalogs,
  key: string,
  locale: string | Locale | undefined,
  vars?: Record<string, string | number>,
): string => {
  const resolved = resolveLocale(typeof locale === "string" ? locale : undefined);
  const message = catalogs[resolved]?.[key] ?? catalogs.en[key] ?? key;
  return interpolate(message, vars);
};

export type Translator = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

/** Binds catalogs and a locale once, for components that translate a lot. */
export const createTranslator = (
  catalogs: Catalogs,
  locale?: string | Locale,
): Translator => {
  const resolved = resolveLocale(typeof locale === "string" ? locale : undefined);
  return (key, vars) => translate(catalogs, key, resolved, vars);
};

// --- dates ------------------------------------------------------------------
// Folded in from the old `@bitflow/date` package: `Intl` does the work, so all
// that is left is choosing sensible defaults.

export const formatDate = (
  value: Date | string | number,
  locale?: string | Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string =>
  new Intl.DateTimeFormat(resolveLocale(
    typeof locale === "string" ? locale : undefined,
  ), options).format(new Date(value));

export const formatDateTime = (
  value: Date | string | number,
  locale?: string | Locale,
): string =>
  formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });

/**
 * A duration as `1:04` or `2:01:04`. Learner-facing timings are minutes, not
 * calendar units, so `Intl.DurationFormat` would be both heavier and wordier.
 */
export const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
};
