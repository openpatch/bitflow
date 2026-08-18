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

// Four entries so a page pays only for what it uses: the learner runtime, the
// authoring canvas, and the two report views, plus an "everything" bundle.
//
// Nothing is external here — these are the files a plain HTML page loads with
// one <script type="module">. The per-bit dynamic imports in `bitLoaders.ts`
// become their own chunks, so a flow downloads only the bits it references.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      formats: ["es"],
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        flow: resolve(import.meta.dirname, "src/flow.ts"),
        editor: resolve(import.meta.dirname, "src/editor.ts"),
        report: resolve(import.meta.dirname, "src/report.ts"),
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "index.css" : "assets/[name][extname]",
      },
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
