import * as endTries from "@bitflow/end-tries";
import * as inputMarkdown from "@bitflow/input-markdown";
import { BitflowProvider } from "@bitflow/provider";
import * as startSimple from "@bitflow/start-simple";
import * as taskChoice from "@bitflow/task-choice";
import * as taskFillInTheBlank from "@bitflow/task-fill-in-the-blank";
import * as taskInput from "@bitflow/task-input";
import * as titleSimple from "@bitflow/title-simple";
import { MDXProvider } from "@mdx-js/react";
import { Code, ThemeProvider } from "@openpatch/patches";
import { AppProps } from "next/dist/next-server/lib/router/router";
import "typeface-rubik";
import "typeface-ubuntu-mono";

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
    <ThemeProvider>
      <BitflowProvider
        locale={locale}
        config={{}}
        bits={{
          end: {
            tries: endTries,
          },
          task: {
            choice: taskChoice,
            "fill-in-the-blank": taskFillInTheBlank,
            input: taskInput,
          },
          input: {
            markdown: inputMarkdown,
          },
          start: {
            simple: startSimple,
          },
          title: {
            simple: titleSimple,
          },
        }}
      >
        <MDXProvider
          components={{
            code: CodeBlock,
          }}
        >
          <Component {...pageProps} locale={locale} />
        </MDXProvider>
      </BitflowProvider>
    </ThemeProvider>
  );
}

export default MyApp;
