/**
 * Adds a package's stylesheet to the document, once.
 *
 * Each package's CSS is bundled into its JavaScript as a string and injected
 * on import, rather than shipped as a file the page has to remember to link.
 * That is what makes "import the bit package" the single action that makes a
 * bit usable: `<bitflow-flow>` resolves bits at runtime, so no page can know in
 * advance which stylesheets to include, and a lazily loaded bit that arrives
 * unstyled is not usable.
 *
 * `id` deduplicates: several bundles on one page inject the same shared
 * stylesheet, and the first one is enough.
 */
export const injectStyles = (id: string, css: string): void => {
  if (typeof document === "undefined") return; // SSR, Node, tests without a DOM
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  // Appended, so the cascade follows module evaluation order: a bit imports
  // `@bitflow/element` before its own body runs, so the shared tokens and
  // primitives are always in the document before the bit's own rules. Prepending
  // reversed that, and a bit's "this answer was correct" tint lost to the
  // generic option style it was meant to override.
  document.head.append(style);
};
