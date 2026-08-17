import { FlowEditor, type FlowEditorHandle } from "@bitflow/bitflow/editor";
import {
  parseFlow,
  type BitflowDocument,
  type ValidationResult,
} from "@bitflow/core";
import r2wc from "@r2wc/react-to-web-component";
import { useEffect, useRef, useState } from "react";
import { loadAllBits } from "./bitLoaders";
import { define, emit, emitError, fetchFlow, getHandle, setHandle } from "./dom";

export type EditorElementProps = {
  container?: HTMLElement;
  flow?: BitflowDocument | string;
  src?: string;
  locale?: string;
  readonly?: boolean;
};

/**
 * The React body behind `<bitflow-flow-editor>`.
 *
 * Unlike the learner element this loads *every* bit up front: an author needs
 * the full palette, and there is nothing to lazily resolve against because the
 * flow being authored does not yet contain the bits they are about to add. It
 * is the same registry and the same custom elements, just fetched eagerly.
 */
const EditorElement = ({
  container,
  flow,
  src,
  locale,
  readonly,
}: EditorElementProps) => {
  const [ready, setReady] = useState(false);
  const [resolved, setResolved] = useState<BitflowDocument | undefined>();
  const handle = useRef<FlowEditorHandle>(null);

  useEffect(() => {
    setHandle(container, handle);
  }, [container]);

  useEffect(() => {
    let cancelled = false;
    void loadAllBits().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const source = flow ?? (src ? await load(src) : undefined);
      if (cancelled || source === undefined) return;

      const parsed = parseFlow(source);
      if (!parsed.ok) {
        emitError(container, parsed.error);
        return;
      }
      setResolved(parsed.value);
    };

    const load = async (url: string) => {
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

  if (!ready) {
    return <div className="bitflow-root bitflow-loading" aria-busy="true" />;
  }

  return (
    <FlowEditor
      ref={handle}
      flow={resolved}
      locale={locale}
      readonly={readonly}
      onEdit={(document) => emit(container, "bitflow-edit", { flow: document })}
      onSave={(document) => emit(container, "bitflow-save", { flow: document })}
      onError={(error) => emitError(container, error)}
    />
  );
};

// r2wc's return type is the opaque `CustomElementConstructor`, which leaves a
// subclass's `this` untyped as an element. Naming the base as an HTMLElement
// constructor is what lets the methods below be written normally.
const Base = r2wc(EditorElement, {
  props: {
    flow: "json",
    src: "string",
    locale: "string",
    readonly: "boolean",
  },
}) as unknown as { new (): HTMLElement };

/** `<bitflow-flow-editor>`: author an assessment. */
export class BitflowEditorElement extends Base {
  /** The canonical current document. */
  getFlow(): BitflowDocument | undefined {
    return getHandle<{ current: FlowEditorHandle | null }>(this)?.current?.getFlow();
  }

  /** Schema, graph and bit-specific diagnostics. */
  validate(): ValidationResult | undefined {
    return getHandle<{ current: FlowEditorHandle | null }>(this)?.current?.validate();
  }

  /** Dispatches `bitflow-save` and returns the document. */
  save(): BitflowDocument | undefined {
    return getHandle<{ current: FlowEditorHandle | null }>(this)?.current?.save();
  }

  undo(): void {
    getHandle<{ current: FlowEditorHandle | null }>(this)?.current?.undo();
  }

  redo(): void {
    getHandle<{ current: FlowEditorHandle | null }>(this)?.current?.redo();
  }
}

export const defineEditorElement = (): void =>
  define("bitflow-flow-editor", BitflowEditorElement);
