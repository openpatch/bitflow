import { useContext } from "react";
import { context, Locale } from "./context";

export const useLocale = (): [Locale, (locale: Locale) => void] => {
  const { locale, setLocale } = useContext(context);
  return [locale, setLocale];
};
