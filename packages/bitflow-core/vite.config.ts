import { resolve } from "path";
import { defineConfig } from "vitest/config";

// Library build. `zod` stays external so a consumer that also uses zod does not
// end up with two copies (and two sets of instanceof-incompatible schemas).
//
// `theme.css` is not imported by any module here — this package is pure
// TypeScript and must stay importable from Node. It is copied into dist as its
// own entry so consumers can `import "@bitflow/core/theme.css"`.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      formats: ["es"],
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["zod"],
    },
  },
  plugins: [
    {
      name: "bitflow-copy-theme",
      async closeBundle() {
        const { copyFile } = await import("node:fs/promises");
        await copyFile(
          resolve(import.meta.dirname, "src/theme.css"),
          resolve(import.meta.dirname, "dist/theme.css"),
        );
      },
    },
  ],
  test: {
    environment: "node",
  },
});
