import { Locale } from "@bitflow/provider";

declare global {
  interface Window {
    __localeId__: Locale;
  }
}
