import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      formats: ["es"],
      // Two entries: the learner runtime and the authoring canvas. Rollup
      // keeps what only the editor needs (@xyflow/react above all) out of the
      // learner chunk, which is what makes <bitflow-flow> cheap to embed.
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        editor: resolve(import.meta.dirname, "src/editor.ts"),
      },
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        "@bitflow/core",
        "@bitflow/element",
      ],
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "index.css" : "assets/[name][extname]",
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
