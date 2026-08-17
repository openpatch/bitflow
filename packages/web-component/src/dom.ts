import type { BitflowError } from "@bitflow/core";

/**
 * Dispatches one of bitflow's events.
 *
 * `bubbles` and `composed` are not optional: every event in the contract has to
 * cross a shadow boundary and reach a listener on the host page, which is where
 * a host puts them.
 */
export const emit = (
  target: HTMLElement | undefined,
  name: string,
  detail: unknown,
): void => {
  target?.dispatchEvent(
    new CustomEvent(name, { detail, bubbles: true, composed: true }),
  );
};

export const emitError = (
  target: HTMLElement | undefined,
  error: BitflowError,
): void => emit(target, "bitflow-error", error);

/**
 * Defines a custom element, unless the name is taken.
 *
 * A page may load both the "everything" bundle and a single-element one, and
 * `customElements.define` throws on a repeat. The definitions are equivalent,
 * so the first one wins rather than the page breaking.
 */
export const define = (name: string, constructor: CustomElementConstructor): void => {
  if (typeof customElements === "undefined") return;
  if (customElements.get(name)) return;
  customElements.define(name, constructor);
};

/**
 * The handle a React body publishes on its host element so the element's own
 * methods (`save()`, `getFlow()`, …) have something to call.
 */
export const HANDLE = Symbol.for("bitflow.handle");

export type WithHandle<T> = HTMLElement & { [HANDLE]?: T };

export const setHandle = <T>(target: HTMLElement | undefined, handle: T): void => {
  if (target) (target as WithHandle<T>)[HANDLE] = handle;
};

export const getHandle = <T>(target: HTMLElement): T | undefined =>
  (target as WithHandle<T>)[HANDLE];

/** Fetches and parses a `.bitflow` document named by the `src` attribute. */
export const fetchFlow = async (
  src: string,
): Promise<{ ok: true; value: unknown } | { ok: false; error: BitflowError }> => {
  try {
    const response = await fetch(src);
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "LOAD_FAILED",
          message: `Loading "${src}" failed with status ${response.status}.`,
        },
      };
    }
    return { ok: true, value: await response.json() };
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: "LOAD_FAILED",
        message: `Loading "${src}" failed: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      },
    };
  }
};
