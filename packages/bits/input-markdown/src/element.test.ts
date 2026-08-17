import { afterEach, describe, expect, it } from "vitest";
import "./index";

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-input-markdown") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data: { markdown: "Some **bold** text." }, ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-input-markdown>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-input-markdown")).toBeDefined();
  });

  it("renders its content", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Some");
  });

  it("offers no check button, having nothing to grade", async () => {
    const element = await mount();
    expect(element.querySelectorAll("button")).toHaveLength(0);
  });

  it("renders Markdown rather than showing its source", async () => {
    const element = await mount();
    expect(element.querySelector("strong")?.textContent).toBe("bold");
  });

  it("does not execute script smuggled through Markdown", async () => {
    const element = await mount({
      data: { ...{ markdown: "Some **bold** text." }, markdown: '<img src=x onerror="window.pwned = true">' },
    });
    expect(element.innerHTML).not.toContain("onerror");
  });
});
