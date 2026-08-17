import { resolve } from "path";
import { defineConfig } from "vite";

// Five plain HTML pages, one per thing being demonstrated. Deliberately no
// framework: the point of these components is that a page needs nothing but a
// script tag, and a React demo would not show that.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        flow: resolve(import.meta.dirname, "flow.html"),
        editor: resolve(import.meta.dirname, "editor.html"),
        bit: resolve(import.meta.dirname, "bit.html"),
        report: resolve(import.meta.dirname, "report.html"),
      },
    },
  },
  optimizeDeps: {
    exclude: ["@bitflow/web-component", "@bitflow/task-choice"],
  },
});
