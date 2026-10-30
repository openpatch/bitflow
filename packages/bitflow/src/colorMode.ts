import { useEffect, useState, type RefObject } from "react";

/**
 * The scheme the graph chrome of the editor draws with.
 *
 * bitflow's own look is pure CSS that resolves against the `color-scheme` of
 * whatever contains it — every colour token is a `light-dark()` pair (see
 * bitflow-core's theme.css). React Flow draws its own chrome from a
 * `colorMode` prop instead: the zoom buttons, the minimap, the dotted
 * background, the edges. The two must agree, so the prop is derived from the
 * same place the CSS resolves: the used color-scheme of the editor's own
 * root element, inherited from its container.
 *
 * `color-scheme` has no event of its own, and reading it is cheap, so changes
 * of the attributes hosts flip it with are the signal to read again —
 * Hyperbook and its books toggle a class on `<html>`, the VS Code workbench
 * on `<body>`. `color-scheme: light dark` defers to the system preference,
 * so its media query is watched as well. An environment without
 * `matchMedia` (jsdom) reads such a host as light, which is what the tests
 * expect.
 */
const usedColorScheme = (element: Element): "light" | "dark" => {
  const schemes = getComputedStyle(element).colorScheme.trim().toLowerCase().split(/\s+/);
  if (schemes.includes("dark")) {
    // `dark` is outright. `light dark` follows the system, the way the CSS
    // above resolves it.
    if (!schemes.includes("light")) return "dark";
    if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  // `light`, and `normal` or nothing: a host that wants dark mode declares
  // it, and light is what the light-dark() palette shows without one.
  return "light";
};

/**
 * `"dark"` while the editor's container is in a dark color-scheme, `"light"`
 * otherwise; follows the host's theme changes.
 */
export const useFlowColorMode = (target: RefObject<Element | null>): "light" | "dark" => {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    const update = () => setColorMode(usedColorScheme(element));
    update();

    const attributes = { attributes: true, attributeFilter: ["class", "style"] } as const;
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, attributes);
    observer.observe(document.body, attributes);

    let media: MediaQueryList | null = null;
    if (typeof matchMedia === "function") {
      media = matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", update);
    }

    return () => {
      observer.disconnect();
      media?.removeEventListener("change", update);
    };
  }, [target]);

  return colorMode;
};
