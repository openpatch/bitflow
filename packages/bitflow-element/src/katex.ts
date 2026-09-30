import { injectStyles } from "@bitflow/core";

/**
 * Loading KaTeX, once, on demand, with its fonts already in the bundle.
 *
 * Every bit renders Markdown, and most Markdown has no formula in it. KaTeX is
 * some 270 kB of script and another 340 kB of inlined fonts, so it is imported
 * only when a text contains maths, and the fonts ride in the same lazy chunk.
 * The same reasoning keeps MathLive out of a flow with no maths task.
 *
 * Never rejects: a caller has to draw the TeX source either way, and a chunk
 * that fails to arrive must not cost the learner the rest of the prose.
 */

export type KatexModule = Pick<typeof import("katex").default, "renderToString">;

let pending: Promise<KatexModule | undefined> | undefined;
let loaded: KatexModule | undefined;

/** Whether `markdown` has anything in it KaTeX would typeset. */
export const hasMath = (markdown?: string): boolean =>
  !!markdown && /\$[^$\s]|\$\$/.test(markdown);

/** KaTeX if it has already arrived, so a remount does not flash the source. */
export const loadedKatex = (): KatexModule | undefined => loaded;

export const loadKatex = (): Promise<KatexModule | undefined> => {
  pending ??= (async () => {
    try {
      const [{ default: katex }, { default: css }] = await Promise.all([
        import("katex"),
        import("./generated/katex.css?inline"),
      ]);
      injectStyles("bitflow-styles-katex", css);
      loaded = katex;
      return katex;
    } catch {
      return undefined;
    }
  })();
  return pending;
};
