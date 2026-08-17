/**
 * jsdom implements neither `ResizeObserver` nor `DOMMatrixReadOnly`, both of
 * which `@xyflow/react` measures the canvas with on mount. Stubs are enough:
 * these tests assert on the editor's behaviour, not on pixel geometry, and a
 * real layout engine would only make them slower and flakier.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as never;

globalThis.DOMMatrixReadOnly ??= class {
  m22 = 1;
  constructor(_transform?: string) {}
} as never;

// React Flow reads these to size the pane; jsdom reports 0 for everything.
Object.defineProperties(globalThis.HTMLElement.prototype, {
  offsetHeight: {
    get() {
      return Number(this.style?.height?.replace("px", "")) || 800;
    },
  },
  offsetWidth: {
    get() {
      return Number(this.style?.width?.replace("px", "")) || 800;
    },
  },
});
