import { afterEach, describe, expect, it } from "vitest";
import "./index";

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-start-simple") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data: { title: "Welcome", markdown: "Some **bold** text." }, ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-start-simple>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-start-simple")).toBeDefined();
  });

  it("renders its content", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Welcome");
  });

  it("offers no check button, having nothing to grade", async () => {
    const element = await mount();
    expect(element.querySelectorAll("button")).toHaveLength(0);
  });

  it("renders Markdown rather than showing its source", async () => {
    const element = await mount();
    expect(element.querySelector("strong")?.textContent).toBe("bold");
  });

  it("shows what is ahead when the author asked, and only then", async () => {
    const flow = {
      version: 1,
      meta: {
        id: "f",
        title: "",
        locale: "en",
        askConfidence: false,
        askReasoning: false,
        pools: [],
        sections: [],
        navigation: "linear",
        allowSkip: true,
        timeLimit: 600,
      },
      nodes: [],
      edges: [],
    };

    const off = await mount({ flow, locale: "en" });
    expect(off.textContent).not.toContain("What is ahead");

    const on = await mount({
      data: { title: "Welcome", markdown: "", showOutline: true },
      flow,
      locale: "en",
    });
    expect(on.textContent).toContain("What is ahead");
    expect(on.textContent).toContain("10 minute(s)");
    expect(on.textContent).toContain("cannot go back");
  });

  it("does not execute script smuggled through Markdown", async () => {
    const element = await mount({
      data: { ...{ title: "Welcome", markdown: "Some **bold** text." }, markdown: '<img src=x onerror="window.pwned = true">' },
    });
    expect(element.innerHTML).not.toContain("onerror");
  });
});
