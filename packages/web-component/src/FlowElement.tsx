import {
  parseFlow,
  type AttemptSnapshot,
  type BitflowDocument,
} from "@bitflow/core";
import { Flow, type FlowHandle } from "@bitflow/bitflow";
import { createReport } from "@bitflow/report";
import r2wc from "@r2wc/react-to-web-component";
import { useEffect, useRef, useState } from "react";
import { bitTypesIn, loadBits } from "./bitLoaders";
import { define, emit, emitError, fetchFlow, getHandle, setHandle } from "./dom";

export type FlowElementProps = {
  container?: HTMLElement;
  flow?: BitflowDocument | string;
  src?: string;
  attempt?: AttemptSnapshot | string;
  locale?: string;
  readonly?: boolean;
  lockedNodeIds?: string[];
};

/**
 * The React body behind `<bitflow-flow>`.
 *
 * Its one job beyond rendering `<Flow>` is resolving the document: fetch it if
 * `src` was given, work out which bits it needs, load exactly those, and only
 * then mount. Until the bits are registered the flow would render every node as
 * "unavailable", so the loading state is not cosmetic.
 */
const FlowElement = ({
  container,
  flow,
  src,
  attempt,
  locale,
  readonly,
  lockedNodeIds,
}: FlowElementProps) => {
  const [resolved, setResolved] = useState<BitflowDocument | undefined>();
  const [loading, setLoading] = useState(false);
  const handle = useRef<FlowHandle>(null);

  useEffect(() => {
    setHandle(container, handle);
  }, [container]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const source = flow ?? (src ? await fetchAndReport(src) : undefined);
      if (cancelled || source === undefined) return;

      const parsed = parseFlow(source);
      if (!parsed.ok) {
        emitError(container, parsed.error);
        return;
      }

      setLoading(true);
      // Only the types this document actually uses. A flow of three
      // multiple-choice questions never downloads the highlighting bit.
      const missing = await loadBits(bitTypesIn(parsed.value));
      if (cancelled) return;

      if (missing.length > 0) {
        emitError(container, {
          code: "UNKNOWN_BIT_TYPE",
          message: `This page cannot show these task types: ${missing.join(", ")}.`,
          diagnostics: missing.map((type) => ({ path: "nodes", message: type })),
        });
      }

      setResolved(parsed.value);
      setLoading(false);
    };

    const fetchAndReport = async (url: string) => {
      const fetched = await fetchFlow(url);
      if (fetched.ok) return fetched.value;
      if (!cancelled) emitError(container, fetched.error);
      return undefined;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [flow, src, container]);

  if (!resolved) {
    return (
      <div className="bitflow-root bitflow-loading" aria-busy={loading}>
        {loading ? "…" : null}
      </div>
    );
  }

  return (
    <Flow
      ref={handle}
      flow={resolved}
      attempt={attempt}
      locale={locale}
      readonly={readonly}
      lockedNodeIds={lockedNodeIds}
      onStateChange={(snapshot) => emit(container, "bitflow-statechange", snapshot)}
      onSave={(snapshot) => emit(container, "bitflow-save", snapshot)}
      onComplete={(snapshot) =>
        // The report travels with the attempt so a host can file the result
        // without having to load the report package to compute it.
        emit(container, "bitflow-complete", {
          attempt: snapshot,
          report: createReport(resolved, snapshot),
        })
      }
      onError={(error) => emitError(container, error)}
    />
  );
};

// r2wc's return type is the opaque `CustomElementConstructor`, which leaves a
// subclass's `this` untyped as an element. Naming the base as an HTMLElement
// constructor is what lets the methods below be written normally.
const Base = r2wc(FlowElement, {
  // Objects arrive as properties; the string forms are for `data-`style HTML
  // authoring and for `src`, which is a URL either way.
  props: {
    flow: "json",
    src: "string",
    attempt: "json",
    locale: "string",
    readonly: "boolean",
    lockedNodeIds: "json",
  },
}) as unknown as { new (): HTMLElement };

/**
 * `<bitflow-flow>`: take an assessment.
 *
 * The imperative half of the contract. r2wc gives the element its properties;
 * these two methods reach the React handle the body published on mount.
 */
export class BitflowFlowElement extends Base {
  /** Dispatches `bitflow-save` and returns the snapshot. */
  save(): AttemptSnapshot | null {
    return getHandle<{ current: FlowHandle | null }>(this)?.current?.save() ?? null;
  }

  /** Abandons the current attempt and starts a fresh one. */
  reset(): void {
    getHandle<{ current: FlowHandle | null }>(this)?.current?.reset();
  }
}

export const defineFlowElement = (): void =>
  define("bitflow-flow", BitflowFlowElement);
