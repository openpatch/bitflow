import { VocabProvider } from "@vocab/react";
import { FC, useEffect, useState } from "react";
import { context, ContextProps, Locale, locales } from "./context";

export type BitflowProviderProps = {
  locale?: string;
} & Pick<ContextProps, "config">;

export const BitflowProvider: FC<BitflowProviderProps> = ({
  children,
  locale,
  config = {},
}) => {
  const [currentLocale, setCurrentLocale] = useState<ContextProps["locale"]>(
    "en-GB"
  );

  const handleSetCurrentLocale = (locale: Locale) => {
    (window as any).__localeId__ = locale;
    setCurrentLocale(locale);
  };

  useEffect(() => {
    if (locales.includes(locale as any)) {
      setCurrentLocale(locale as Locale);
    } else {
      setCurrentLocale("en-GB");
    }
  }, [locale]);

  return (
    <context.Provider
      value={{
        locale: currentLocale,
        setLocale: handleSetCurrentLocale,
        config,
      }}
    >
      <VocabProvider language={currentLocale}>{children}</VocabProvider>
    </context.Provider>
  );
};
