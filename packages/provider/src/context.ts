import { createContext } from "react";
export type Locale = "en" | "de";
export const locales: Locale[] = ["en", "de"];
export type Config = {
  defaultLocale?: Locale;
};

export type ContextProps = {
  locale: Locale;
  config: Config;
  setLocale: (locale: Locale) => void;
};

export const context = createContext<ContextProps>({
  locale: "en",
  config: {},
  setLocale: () => null,
});
