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
//
// `host.html` and `join.html` are missing from the inputs on purpose. The live
// session needs a Cloudflare Worker deployed beside the gallery, and without
// one those two pages load and then fail to connect — worse than not being
// there. Their source stays in the repo and still type-checks; put the two
// lines back, with the host card and `VITE_PARTY_HOST`, to ship them again.
export default defineConfig({
  // Served from the root in dev and from `/bitflow/` on GitHub Pages, which
  // `configure-pages` hands the build as `BASE_PATH`. Empty is what that action
  // reports for a custom domain, so it falls back to the root rather than
  // producing an empty base. Public files are referenced relative to the page
  // for the same reason — Vite rewrites `/x.png` in markup, but not a string in
  // a `<option value>` or a `fetch`.
  base: process.env.BASE_PATH || "/",
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
