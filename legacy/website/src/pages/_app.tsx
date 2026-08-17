import { bits } from "@bitflow/bits";
import { BitflowProvider } from "@bitflow/provider";
import { MDXProvider } from "@mdx-js/react";
import { Code, PatchesProvider } from "@openpatch/patches";
import { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import "typeface-rubik";
import "typeface-ubuntu-mono";
import { Link } from "../components/Link";

type CodeBlockProps = {
  className: string;
  children: string;
};

const CodeBlock = ({ className, children }: CodeBlockProps) => {
  const language = className.replace(/language-/, "");
  return <Code language={language}>{children.trim()}</Code>;
};

function MyApp({ Component, pageProps, router }: AppProps) {
  const locale = router.locale || "en";
  return (
    <PatchesProvider linkComponent={Link}>
      <DefaultSeo
        defaultTitle="Bitflow by OpenPatch"
        titleTemplate="%s | Bitflow by OpenPatch"
        openGraph={{
          type: "website",
          locale: "en",
          url: "https://bitflow.openpatch.org",
          site_name: "Bitflow by OpenPatch",
          images: [
            {
              url: "https://repository-images.githubusercontent.com/352640961/081abbe6-ad9d-4e64-bd3a-9c4cc9a3b915",
              width: 1280,
              height: 640,
            },
          ],
        }}
        twitter={{
          handle: "@openpatchorg",
          site: "@openpatchorg",
          cardType: "summary_large_image",
        }}
      />
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
