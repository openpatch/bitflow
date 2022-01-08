import { bits } from "@bitflow/bits";
import { BitflowProvider } from "@bitflow/provider";
import { MDXProvider } from "@mdx-js/react";
import { Code, PatchesProvider } from "@openpatch/patches";
import { AppProps } from "next/app";
import "typeface-rubik";
import "typeface-ubuntu-mono";
import { Link } from "../components/Link";

type CodeBlockProps = {
  className: string;
  children: string;
};

const CodeBlock = ({ className, children }: CodeBlockProps) => {
  const language = className.replace(/language-/, "");
  return <Code language={language}>{children}</Code>;
};

function MyApp({ Component, pageProps, router }: AppProps) {
  const locale = router.locale || "en";
  return (
    <PatchesProvider linkComponent={Link}>
      <BitflowProvider locale={locale} config={{}} bits={bits}>
        <MDXProvider
          components={{
            code: CodeBlock,
          }}
        >
          <Component {...pageProps} locale={locale} />
        </MDXProvider>
      </BitflowProvider>
    </PatchesProvider>
  );
}

export default MyApp;
