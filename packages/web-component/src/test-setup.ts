// Not every test needs a DOM — the fixture checks read files under the node
// environment, where none of this applies.
if (typeof HTMLElement !== "undefined") {
  install();
}

/**
 * `@xyflow/react` measures the editor canvas on mount with `ResizeObserver`
 * and `DOMMatrixReadOnly`, neither of which jsdom implements. Stubs are
 * enough: nothing here asserts on geometry, and the accessibility checks care
 * about markup rather than layout.
 */
function install() {
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

  // React Flow sizes the pane from these; jsdom reports 0 for everything.
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
}
