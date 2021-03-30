import { BitflowProvider } from "@bitflow/provider";
import { ThemeProvider } from "@openpatch/patches";
import { AppProps } from "next/dist/next-server/lib/router/router";
import "typeface-rubik";
import "typeface-ubuntu-mono";

function MyApp({ Component, pageProps, router }: AppProps) {
  const locale = router.locale || "en";
  return (
    <ThemeProvider>
      <BitflowProvider locale={locale} config={{}}>
        <Component {...pageProps} locale={locale} />
      </BitflowProvider>
    </ThemeProvider>
  );
}

export default MyApp;
