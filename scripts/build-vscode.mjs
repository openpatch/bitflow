#!/usr/bin/env node

import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes("--watch");

const commonOptions = {
  bundle: true,
  sourcemap: true,
  minify: !isWatch,
  logLevel: "info",
};

/** The half that runs in VS Code's extension host, under Node. */
const extensionOptions = {
  ...commonOptions,
  entryPoints: [path.join(__dirname, "../platforms/vscode/src/extension.ts")],
  outfile: path.join(__dirname, "../platforms/vscode/dist/extension.js"),
  format: "cjs",
  platform: "node",
  // Provided by VS Code at runtime; bundling it would break the extension.
  external: ["vscode"],
  target: "node16",
};

/**
 * The half that runs in the webview, which is a browser.
 *
 * One file, no code splitting: the content security policy admits exactly one
 * nonce-bound script, so every bit and both stylesheets have to be inside it.
 */
const webviewOptions = {
  ...commonOptions,
  entryPoints: [path.join(__dirname, "../platforms/vscode/src/webview.tsx")],
  outfile: path.join(__dirname, "../platforms/vscode/dist/webview.js"),
  format: "iife",
  platform: "browser",
  target: ["es2022", "chrome100", "firefox100"],
  loader: {
    ".svg": "dataurl",
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".jpeg": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".ttf": "dataurl",
    ".eot": "dataurl",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

/**
 * esbuild writes the webview's CSS next to its JS under the entry's name. The
 * webview HTML asks for `webview.css`, which is the same file — this just
 * confirms it arrived, so a missing stylesheet fails the build rather than
 * showing up as an unstyled editor.
 */
const checkStyles = async () => {
  const { access } = await import("fs/promises");
  const stylesheet = path.join(
    __dirname,
    "../platforms/vscode/dist/webview.css",
  );
  try {
    await access(stylesheet);
  } catch {
    throw new Error(
      `esbuild produced no ${stylesheet}. The webview must import a stylesheet ` +
        `(@bitflow/bitflow/index.css) for the editor to be styled.`,
    );
  }
};

async function build() {
  try {
    if (isWatch) {
      const contexts = await Promise.all([
        esbuild.context(extensionOptions),
        esbuild.context(webviewOptions),
      ]);
      await Promise.all(contexts.map((c) => c.watch()));
      console.log("Watching for changes...");
    } else {
      await Promise.all([
        esbuild.build(extensionOptions),
        esbuild.build(webviewOptions),
      ]);
      await checkStyles();
      console.log("Build complete!");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
