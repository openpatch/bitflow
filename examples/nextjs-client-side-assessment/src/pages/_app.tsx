import { bits } from "@bitflow/bits";
import { BitflowProvider } from "@bitflow/provider";
import { PatchesProvider } from "@openpatch/patches";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import "typeface-rubik";
import "typeface-ubuntu-mono";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <PatchesProvider>
      <BitflowProvider
        locale={router.locale}
        config={{}}
        bits={bits}
      >
        <Component {...pageProps} />
      </BitflowProvider>
    </PatchesProvider>
  );
}

export default MyApp;
