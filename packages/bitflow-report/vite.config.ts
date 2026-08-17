import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Held at Vite 7, and @vitejs/plugin-react at 5 with it, on purpose. Vite 8
// bundles with Rolldown, which leaves the `require("react")` inside
// use-sync-external-store's CJS shim unresolved, and the bundle throws on load:
// "Calling `require` for \"react\" in an environment that doesn't expose the
// `require` function". That shim arrives through @xyflow/react, which depends
// on zustand 4, so it cannot be avoided from here. Revisit when either React
// Flow moves off it or Rolldown handles the interop.

// `@bitflow/core` stays external, and nothing else from the workspace is
// imported at all: a page embedding only <bitflow-report> must not pull in
// @xyflow/react, the editor, or any bit package. `bundle.test.ts` checks it.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      formats: ["es"],
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, "@bitflow/core", "zod"],
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "index.css" : "assets/[name][extname]",
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
