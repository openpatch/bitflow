import DOMPurify from "dompurify";
import { Marked, type TokenizerAndRendererExtension } from "marked";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { hasMath, loadKatex, loadedKatex, type KatexModule } from "./katex";

/**
 * Renders author-written Markdown.
 *
 * A `.bitflow` file is data, and data from a teacher, a shared repository or a
 * hand-edited file is untrusted input. Markdown permits raw HTML, so the
 * rendered output goes through DOMPurify before it reaches the DOM — a
 * hand-rolled allow-list is exactly the kind of security code that quietly
 * rots, and this is the one place every bit's Markdown passes through.
 *
 * Maths written as `$…$` or `$$…$$` is typeset with KaTeX. KaTeX is loaded
 * only when a text actually contains some, so a flow without a formula never
 * downloads it; until it arrives the TeX source stands in.
 */
export const Markdown = ({
  markdown,
  className,
}: {
  markdown?: string;
  className?: string;
}): ReactElement | null => {
  const katex = useKatex(markdown);
  const html = useMemo(() => renderMarkdown(markdown, katex), [markdown, katex]);
  if (!html) return null;

  return (
    <div
      className={className ? `bitflow-prose ${className}` : "bitflow-prose"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/** KaTeX, once `markdown` needs it and it has arrived. */
const useKatex = (markdown?: string): KatexModule | undefined => {
  const needed = hasMath(markdown);
  const [katex, setKatex] = useState(() => (needed ? loadedKatex() : undefined));

  useEffect(() => {
    if (!needed || katex) return;
    let live = true;
    void loadKatex().then((module) => {
      if (live && module) setKatex(module);
    });
    return () => {
      live = false;
    };
  }, [needed, katex]);

  return needed ? katex : undefined;
};

/**
 * Where a formula goes. The TeX rides in an attribute through the sanitizer
 * and is typeset afterwards, because KaTeX's output depends on the inline
 * `style` attributes the sanitizer rightly strips from anything an author
 * wrote. An author who writes this span by hand gets their own TeX typeset —
 * KaTeX with `trust: false` is safe on any input, so that is not a way round
 * the sanitizer.
 */
const MATH_ATTR = "data-bitflow-tex";
const DISPLAY_ATTR = "data-bitflow-display";

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const placeholder = (tex: string, display: boolean) =>
  display
    ? `<div class="bitflow-math bitflow-math-display" ${MATH_ATTR}="${escapeAttr(tex)}" ${DISPLAY_ATTR}=""></div>`
    : `<span class="bitflow-math" ${MATH_ATTR}="${escapeAttr(tex)}"></span>`;

/**
 * `$$…$$` on lines of its own is a displayed formula; so is `$$…$$` inside a
 * paragraph. `$…$` is inline, with the rules Pandoc uses to leave prices
 * alone: the opening `$` is followed by a non-space, the closing one follows a
 * non-space and is not followed by a digit. `\$` is a literal dollar.
 */
const blockMath: TokenizerAndRendererExtension = {
  name: "blockMath",
  level: "block",
  start: (src) => src.match(/^ {0,3}\$\$/m)?.index,
  tokenizer(src) {
    const match = /^ {0,3}\$\$([\s\S]+?)\$\$[ \t]*(?:\n+|$)/.exec(src);
    if (!match) return undefined;
    return { type: "blockMath", raw: match[0], text: match[1]!.trim() };
  },
  renderer: (token) => placeholder(token.text as string, true) + "\n",
};

const inlineMath: TokenizerAndRendererExtension = {
  name: "inlineMath",
  level: "inline",
  start: (src) => {
    const index = src.indexOf("$");
    return index >= 0 ? index : undefined;
  },
  tokenizer(src) {
    const display = /^\$\$(?!\$)([\s\S]+?)\$\$/.exec(src);
    if (display) {
      return { type: "inlineMath", raw: display[0], text: display[1]!.trim(), display: true };
    }
    const inline = /^\$(?![\s$])((?:\\.|[^\\$])*?[^\s\\])\$(?!\d)/.exec(src);
    if (inline) {
      return { type: "inlineMath", raw: inline[0], text: inline[1]!, display: false };
    }
    return undefined;
  },
  renderer: (token) => placeholder(token.text as string, Boolean(token.display)),
};

// Its own instance, so the extensions do not leak into anyone else's `marked`.
const markdownParser = new Marked({ async: false, gfm: true, breaks: true });
markdownParser.use({ extensions: [blockMath, inlineMath] });

/**
 * Markdown → sanitized HTML. Exported so tests can assert on the sanitizer
 * directly rather than through a rendered component.
 *
 * Without `katex` a formula is left as its TeX source, which is what a
 * learner reads while KaTeX loads, or if it never does.
 */
export const renderMarkdown = (markdown?: string, katex?: KatexModule): string => {
  // DOMPurify has nothing to sanitize with outside a DOM, and hands the
  // input back untouched. Nothing renders prose on a server; if something
  // starts to, it gets nothing rather than unsanitized HTML.
  if (!markdown || typeof document === "undefined") return "";

  const html = markdownParser.parse(markdown) as string;

  const fragment = DOMPurify.sanitize(html, {
    // `javascript:` and `data:` URLs are the ones that execute; everything a
    // teacher legitimately links to is covered here.
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Belt and braces: DOMPurify strips these anyway, and being explicit means
    // a future config change cannot quietly let them back in.
    FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "formaction", "srcdoc"],
    RETURN_DOM_FRAGMENT: true,
  });

  for (const element of fragment.querySelectorAll<HTMLElement>(`[${MATH_ATTR}]`)) {
    const tex = element.getAttribute(MATH_ATTR) ?? "";
    const display = element.hasAttribute(DISPLAY_ATTR);
    element.removeAttribute(MATH_ATTR);
    element.removeAttribute(DISPLAY_ATTR);
    if (katex) {
      element.innerHTML = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        // Never: `\href`, `\url` and `\htmlClass` and friends are what `trust`
        // would unlock, and author TeX is as untrusted as author HTML.
        trust: false,
        strict: "ignore",
        output: "htmlAndMathml",
      });
    } else {
      element.classList.add("bitflow-math-pending");
      element.textContent = display ? `$$${tex}$$` : `$${tex}$`;
    }
  }

  const container = document.createElement("div");
  container.append(fragment);
  return container.innerHTML;
};
