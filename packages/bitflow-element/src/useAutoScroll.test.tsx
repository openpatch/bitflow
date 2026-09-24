import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoScroll } from "./useAutoScroll";

/** A 200px-tall scroller holding 1000px of content, 100px down the page. */
const scroller = () => {
  const outer = document.createElement("div");
  outer.style.overflowY = "auto";
  Object.defineProperty(outer, "scrollHeight", { value: 1000 });
  Object.defineProperty(outer, "clientHeight", { value: 200 });
  outer.getBoundingClientRect = () =>
    ({ top: 100, bottom: 300, left: 0, right: 200 }) as DOMRect;
  const inner = document.createElement("div");
  outer.append(inner);
  document.body.append(outer);
  return { outer, inner };
};

let frames: FrameRequestCallback[] = [];
const runFrame = () => {
  const due = frames;
  frames = [];
  due.forEach((frame) => frame(0));
};

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

const mount = (onScroll = vi.fn()) => {
  let api!: ReturnType<typeof useAutoScroll>;
  const Probe = () => {
    api = useAutoScroll(onScroll);
    return null;
  };
  render(<Probe />);
  return { api: () => api, onScroll };
};

describe("useAutoScroll", () => {
  it("scrolls the nearest scroller down with the pointer at its bottom edge", () => {
    const { outer, inner } = scroller();
    const { api, onScroll } = mount();

    api().follow(inner, 10, 295);
    runFrame();

    expect(outer.scrollTop).toBeGreaterThan(0);
    expect(onScroll).toHaveBeenCalledTimes(1);
  });

  it("leaves everything alone with the pointer in the middle", () => {
    const { outer, inner } = scroller();
    const { api, onScroll } = mount();

    api().follow(inner, 10, 200);
    runFrame();

    expect(outer.scrollTop).toBe(0);
    expect(onScroll).not.toHaveBeenCalled();
  });

  it("keeps scrolling while the pointer is held there, until stopped", () => {
    const { outer, inner } = scroller();
    const { api } = mount();

    api().follow(inner, 10, 299);
    runFrame();
    const first = outer.scrollTop;
    runFrame();
    expect(outer.scrollTop).toBeGreaterThan(first);

    api().stop();
    const stopped = outer.scrollTop;
    runFrame();
    expect(outer.scrollTop).toBe(stopped);
  });
});
