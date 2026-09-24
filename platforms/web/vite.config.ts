import { resolve } from "path";
import { defineConfig } from "vite";

// Held at Vite 7, and @vitejs/plugin-react at 5 with it, on purpose. Vite 8
// bundles with Rolldown, which leaves the `require("react")` inside
// use-sync-external-store's CJS shim unresolved, and the bundle throws on load:
// "Calling `require` for \"react\" in an environment that doesn't expose the
// `require` function". That shim arrives through @xyflow/react, which depends
// on zustand 4, so it cannot be avoided from here. Revisit when either React
// Flow moves off it or Rolldown handles the interop.

// Plain HTML pages, one per thing being demonstrated. Deliberately no
// framework: the point of these components is that a page needs nothing but a
// script tag, and a React demo would not show that.
export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        flow: resolve(import.meta.dirname, "flow.html"),
        editor: resolve(import.meta.dirname, "editor.html"),
        bit: resolve(import.meta.dirname, "bit.html"),
        bits: resolve(import.meta.dirname, "bits.html"),
        report: resolve(import.meta.dirname, "report.html"),
      },
    },
  },
  optimizeDeps: {
    exclude: ["@bitflow/web-component", "@bitflow/task-choice"],
  },
});
