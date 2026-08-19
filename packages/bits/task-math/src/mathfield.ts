import { injectStyles } from "@bitflow/core";

/**
 * Loading MathLive, once, on demand, with its fonts already in the bundle.
 *
 * Three things have to be true before a `<math-field>` is worth rendering, and
 * none of them is true at import time:
 *
 * - MathLive is 823 kB. The schema and the marking are what a flow needs in
 *   order to *run*; the editor is what it needs in order to be *answered*, and
 *   only on the step that asks. Loading it eagerly would put most of a
 *   megabyte in front of every assessment that happens to contain one maths
 *   question.
 * - It only exists in a browser. Its `node` export condition is a stub without
 *   `MathfieldElement` in it at all, and mounting one needs `ResizeObserver`
 *   and a virtual-keyboard singleton that jsdom has neither of. Anything that
 *   renders on a server, or in a test, has to have somewhere else to go.
 * - Its fonts are twenty separate woff2 files that it fetches at runtime from
 *   `fontsDirectory`. That is the asset a consumer has to remember to deploy,
 *   which is the thing `injectStyles` exists to avoid — so they are inlined
 *   into the stylesheet here and MathLive is told not to go looking.
 *
 * The upshot is that the caller must cope with "not loaded", which is not a
 * concession to testing: a chunk that fails to arrive is an ordinary Tuesday,
 * and a learner who cannot answer because a CDN blinked is a real one.
 */

export type MathfieldModule = {
  MathfieldElement: new () => HTMLElement & MathfieldApi;
};

/** The parts of a mathfield this bit uses. */
export type MathfieldApi = {
  value: string;
  readOnly: boolean;
  mathVirtualKeyboardPolicy: "auto" | "manual" | "sandboxed";
  getPrompts: () => string[];
  getPromptValue: (name: string) => string;
  setPromptValue: (name: string, value: string) => void;
  setPromptState: (
    name: string,
    state: "correct" | "incorrect" | "undefined",
    locked?: boolean,
  ) => void;
};

let pending: Promise<MathfieldModule | undefined> | undefined;

/**
 * The MathLive module, or `undefined` where there cannot be one.
 *
 * Never rejects. A caller deciding what to render has no use for an exception
 * — it has to draw the fallback either way — and an unhandled rejection in a
 * lazy import is a blank step rather than a message.
 */
export const loadMathfield = async (): Promise<MathfieldModule | undefined> => {
  pending ??= (async () => {
    if (typeof window === "undefined" || typeof customElements === "undefined") {
      return undefined;
    }
    try {
      const module = (await import("mathlive")) as unknown as MathfieldModule & {
        MathfieldElement: { fontsDirectory?: string | null; soundsDirectory?: string | null };
      };
      if (!module?.MathfieldElement) return undefined;

      // The fonts are in the stylesheet below, so MathLive must not also go
      // looking for a `fonts/` directory that will not be there. Sounds are
      // off outright: a task that clicks at a learner is a task nobody wants
      // twice, and it is another directory to deploy.
      module.MathfieldElement.fontsDirectory = null;
      module.MathfieldElement.soundsDirectory = null;

      // Imported here rather than at the top of the file so the 350 kB of
      // base64 rides in MathLive's own chunk. At module scope it would land in
      // the eager one, which is the half that exists to stay small.
      const { default: fonts } = await import("./generated/fonts.css?inline");
      injectStyles("bitflow-styles-mathlive-fonts", fonts);
      return module;
    } catch {
      return undefined;
    }
  })();
  return pending;
};

/** Test seam: forget the load so a mock, or a failure, can be tried instead. */
export const resetMathfield = (): void => {
  pending = undefined;
  strikeSheet = undefined;
};

let strikeSheet: CSSStyleSheet | undefined;

/**
 * Thins the line MathLive draws through a blank it has been told is wrong.
 *
 * It draws an SVG diagonal at `stroke-width: 0.5` in the box's own user units,
 * so it scales with the field and lands as a bar thick enough to cover what is
 * underneath it. What is underneath it is the learner's own answer, and a
 * learner being told they are wrong is exactly the moment they need to see
 * what they wrote — the right blank beside it stays perfectly legible, which
 * makes the asymmetry worse rather than better.
 *
 * The rule goes into the field's own shadow root, which MathLive leaves open.
 * That is reaching past its API, so it is written to fail quietly: if the class
 * name goes away in some later version the rule stops matching and the strike
 * goes back to MathLive's default, which is ugly rather than broken. The mark
 * itself does not depend on it — the box keeps its red outline and glow, and
 * the outcome is stated in words underneath either way.
 */
export const thinIncorrectStrike = (element: HTMLElement): void => {
  const root = element.shadowRoot;
  if (!root || !("adoptedStyleSheets" in root)) return;
  try {
    if (!strikeSheet) {
      strikeSheet = new CSSStyleSheet();
      strikeSheet.replaceSync(
        ".ML__incorrectPromptBox line { stroke-width: 0.1px; opacity: 0.7; }",
      );
    }
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, strikeSheet];
  } catch {
    // Constructable stylesheets are everywhere this bit runs, but a failure
    // here must not cost the learner the field itself.
  }
};
