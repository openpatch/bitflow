import { Locale } from "@bitflow/provider";
import { de, enGB, enUS, es, fr, it, nl, pt, tr } from "date-fns/locale";

export const locales: Record<Locale, typeof de> = {
  de,
  en: enGB,
  "en-US": enUS,
  "en-GB": enGB,
  it,
  fr,
  tr,
  pt,
  es,
  nl,
};
