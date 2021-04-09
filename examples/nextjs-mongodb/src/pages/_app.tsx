import { BitflowProvider } from "@bitflow/provider";
import { PatchesProvider } from "@openpatch/patches";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import "typeface-rubik";
import "typeface-ubuntu-mono";
import { Link } from "../components/Link";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <PatchesProvider linkComponent={Link}>
      <BitflowProvider locale={router.locale} config={{}}>
        <div id="root" />
        <Component {...pageProps} />
      </BitflowProvider>
    </PatchesProvider>
  );
}

export default MyApp;
