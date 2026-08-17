import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// React stays external so the page ends up with exactly one copy of it, no
// matter how many bit bundles it loads.
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
      // Patterns, not bare names: r2wc reaches for `react-dom/client`, and an
      // exact-match list silently bundles a second copy of react-dom with it.
      external: [/^react($|\/)/, /^react-dom($|\/)/, "@bitflow/core"],
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
