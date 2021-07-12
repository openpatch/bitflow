import * as endTries from "@bitflow/end-tries";
import { BitflowProvider } from "@bitflow/provider";
import * as startSimple from "@bitflow/start-simple";
import * as taskChoice from "@bitflow/task-choice";
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
        bits={{
          end: {
            tries: endTries,
          },
          start: {
            simple: startSimple,
          },
          input: {},
          task: {
            choice: taskChoice,
          },
          title: {},
        }}
      >
        <Component {...pageProps} />
      </BitflowProvider>
    </PatchesProvider>
  );
}

export default MyApp;
