import { BitflowProvider } from "@bitflow/provider";
import { ThemeProvider } from "@openpatch/patches";
import { AppProps } from "next/dist/next-server/lib/router/router";
import "typeface-rubik";
import "typeface-ubuntu-mono";

function MyApp({ Component, pageProps, router }: AppProps) {
  const locale = router.locale || "en";
  return (
    <BitflowProvider locale={locale} config={{}}>
      <ThemeProvider>
        <Component {...pageProps} locale={locale} />
      </ThemeProvider>
    </BitflowProvider>
  );
}

export default MyApp;
