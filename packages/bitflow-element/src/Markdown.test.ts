import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./Markdown";

/**
 * The acceptance matrix requires that malicious HTML or URLs in author-written
 * Markdown cannot execute after rendering. Every case here is a `.bitflow`
 * file someone could hand a learner.
 */
describe("renderMarkdown", () => {
  it("renders ordinary Markdown", () => {
    expect(renderMarkdown("**bold** and `code`")).toContain("<strong>bold</strong>");
    expect(renderMarkdown("# Heading")).toContain("<h1>Heading</h1>");
    expect(renderMarkdown("- one\n- two")).toContain("<li>one</li>");
  });

  it("keeps safe links and images", () => {
    expect(renderMarkdown("[docs](https://openpatch.org)")).toContain(
      'href="https://openpatch.org"',
    );
    expect(renderMarkdown("![alt](https://example.org/a.png)")).toContain(
      'src="https://example.org/a.png"',
    );
    expect(renderMarkdown("[mail](mailto:a@b.c)")).toContain("mailto:a@b.c");
  });

  it("is empty for empty input", () => {
    expect(renderMarkdown()).toBe("");
    expect(renderMarkdown("")).toBe("");
  });

  describe("sanitising", () => {
    const rendered = (markdown: string) => renderMarkdown(markdown);

    it("strips script tags", () => {
      const html = rendered("<script>window.pwned = true</script>hello");
      expect(html).not.toContain("<script");
      expect(html).not.toContain("window.pwned");
    });

    it("strips inline event handlers", () => {
      const html = rendered('<img src="x" onerror="window.pwned = true">');
      expect(html).not.toContain("onerror");
    });

    it("strips javascript: URLs", () => {
      const html = rendered("[click](javascript:alert(1))");
      expect(html).not.toContain("javascript:");
    });

    it("strips javascript: URLs written as raw HTML", () => {
      const html = rendered('<a href="javascript:alert(1)">click</a>');
      expect(html).not.toContain("javascript:");
    });

    it("strips iframes and objects", () => {
      const html = rendered(
        '<iframe src="https://evil.test"></iframe><object data="x"></object>',
      );
      expect(html).not.toContain("<iframe");
      expect(html).not.toContain("<object");
    });

    it("strips style attributes and tags", () => {
      const html = rendered('<style>body{display:none}</style><p style="color:red">x</p>');
      expect(html).not.toContain("<style");
      expect(html).not.toContain("style=");
    });

    it("strips form controls that could phish for credentials", () => {
      const html = rendered('<form action="https://evil.test"><input name="password"></form>');
      expect(html).not.toContain("<form");
      expect(html).not.toContain("<input");
    });

    it("survives an svg-based handler", () => {
      const html = rendered('<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>');
      expect(html).not.toContain("javascript:");
    });
  });
});
