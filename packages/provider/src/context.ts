import { createContext } from "react";
export type Locale = "en-GB" | "en-US" | "de";
export const locales: Locale[] = ["en-GB", "en-US", "de"];
export type Config = {
  defaultLocale?: Locale;
};

export type ContextProps = {
  locale: Locale;
  config: Config;
  setLocale: (locale: Locale) => void;
};

export const context = createContext<ContextProps>({
  locale: "en-GB",
  config: {},
  setLocale: () => null,
});
