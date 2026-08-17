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
