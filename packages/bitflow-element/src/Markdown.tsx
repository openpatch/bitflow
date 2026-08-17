import DOMPurify from "dompurify";
import { marked } from "marked";
import { useMemo, type ReactElement } from "react";

/**
 * Renders author-written Markdown.
 *
 * A `.bitflow` file is data, and data from a teacher, a shared repository or a
 * hand-edited file is untrusted input. Markdown permits raw HTML, so the
 * rendered output goes through DOMPurify before it reaches the DOM — a
 * hand-rolled allow-list is exactly the kind of security code that quietly
 * rots, and this is the one place every bit's Markdown passes through.
 */
export const Markdown = ({
  markdown,
  className,
}: {
  markdown?: string;
  className?: string;
}): ReactElement | null => {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  if (!html) return null;

  return (
    <div
      className={className ? `bitflow-prose ${className}` : "bitflow-prose"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Markdown → sanitized HTML. Exported so tests can assert on the sanitizer
 * directly rather than through a rendered component.
 */
export const renderMarkdown = (markdown?: string): string => {
  if (!markdown) return "";

  // `async: false` keeps `parse` returning a string rather than a promise.
  const html = marked.parse(markdown, { async: false, gfm: true, breaks: true });

  return DOMPurify.sanitize(html, {
    // `javascript:` and `data:` URLs are the ones that execute; everything a
    // teacher legitimately links to is covered here.
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Belt and braces: DOMPurify strips these anyway, and being explicit means
    // a future config change cannot quietly let them back in.
    FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "formaction", "srcdoc"],
  });
};
