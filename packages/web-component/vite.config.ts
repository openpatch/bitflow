import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

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
  },
});
