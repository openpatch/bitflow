import { EndBit, InputBit, StartBit, TaskBit, TitleBit } from "@bitflow/core";
import { createContext } from "react";

export type Locale =
  | "en"
  | "en-GB"
  | "en-US"
  | "de"
  | "fr"
  | "it"
  | "nl"
  | "tr"
  | "es"
  | "pt";
export const locales: Locale[] = [
  "en",
  "en-GB",
  "en-US",
  "de",
  "fr",
  "it",
  "nl",
  "tr",
  "es",
  "pt",
];
export type Config = {
  defaultLocale?: Locale;
};

export type ContextProps = {
  locale: Locale;
  config: Config;
  setLocale: (locale: Locale) => void;
  bits: {
    task: Partial<Record<Bitflow.Task["subtype"], TaskBit>>;
    end: Partial<Record<Bitflow.End["subtype"], EndBit>>;
    start: Partial<Record<Bitflow.Start["subtype"], StartBit>>;
    title: Partial<Record<Bitflow.Title["subtype"], TitleBit>>;
    input: Partial<Record<Bitflow.Input["subtype"], InputBit>>;
  };
};

export const context = createContext<ContextProps>({
  locale: "en-GB",
  config: {},
  setLocale: () => null,
  bits: {
    task: {},
    end: {},
    start: {},
    title: {},
    input: {},
  },
});
