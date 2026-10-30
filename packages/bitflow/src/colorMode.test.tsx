import { act, render, screen } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlowColorMode } from "./colorMode";

/*
 * React Flow draws its graph chrome from a colorMode prop, bitflow's own look
 * from the color-scheme of the container — the prop is derived from the same
 * scheme so the two can never disagree (a dark editor with light zoom buttons
 * was the report). jsdom has no cascade for `color-scheme`, so these tests
 * mock getComputedStyle and read the hook through a probe.
 */

const schemeOf = vi.hoisted(() => vi.fn(() => ""));

/** A MediaQueryList the hook can listen to, with a settable answer. */
const mediaList = () => {
  const list = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return list as typeof list & MediaQueryList;
};
const matchMediaMock = vi.fn(mediaList);

vi.stubGlobal("getComputedStyle", (element: Element) => ({
  colorScheme: schemeOf(element),
}));
// The hook registers a listener when matchMedia exists, so the stub is a
// MediaQueryList.
vi.stubGlobal("matchMedia", matchMediaMock);

let clearScheme: () => void = () => {};
beforeEach(() => {
  schemeOf.mockClear();
  schemeOf.mockReturnValue("");
  matchMediaMock.mockImplementation(mediaList);
  clearScheme = () => {};
});
afterEach(() => clearScheme());

/** The hook needs a ref to the element the scheme is read from. */
const Probe = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const colorMode = useFlowColorMode(ref);
  return (
    <div ref={ref}>
      <p>colorMode: {mounted ? colorMode : "not mounted"}</p>
    </div>
  );
};

const colorMode = async () => {
  // Not "colorMode: not mounted": the answer only counts once the hook ran.
  const text = await screen.findByText(/^colorMode: (light|dark)$/);
  return text.textContent?.replace("colorMode: ", "");
};

describe("useFlowColorMode", () => {
  it("is dark in a dark color-scheme", async () => {
    schemeOf.mockReturnValue("dark");
    render(<Probe />);
    expect(await colorMode()).toBe("dark");
  });

  it("is light in a light one, and in a page without a scheme", async () => {
    schemeOf.mockReturnValue("light");
    render(<Probe />);
    expect(await colorMode()).toBe("light");

    schemeOf.mockReturnValue("");
    // The probe re-reads when the host flips a class or a style, which is how
    // every host switches its color-scheme.
    await act(async () => {
      document.documentElement.classList.toggle("dark", true);
    });
    expect(await colorMode()).toBe("light");
    clearScheme = () => document.documentElement.classList.remove("dark");
  });

  it("follows the system where the scheme is `light dark`", async () => {
    const media = mediaList();
    matchMediaMock.mockImplementation(() => media);
    schemeOf.mockReturnValue("light dark");

    render(<Probe />);
    expect(await colorMode()).toBe("light");

    media.matches = true;
    await act(async () => {
      media.addEventListener.mock.calls[0][1]();
    });
    expect(await colorMode()).toBe("dark");
  });

  it("follows a theme change of the host", async () => {
    render(<Probe />);
    expect(await colorMode()).toBe("light");

    schemeOf.mockReturnValue("dark");
    await act(async () => {
      document.documentElement.setAttribute("style", "--x: 1");
    });
    expect(await colorMode()).toBe("dark");
  });
});
