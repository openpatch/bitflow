import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

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
