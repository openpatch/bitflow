import { Flow } from "@bitflow/bitflow";
import { FlowEditor } from "@bitflow/bitflow/editor";
import { parseFlow, type BitflowDocument } from "@bitflow/core";

// Every bit, imported eagerly. The webview is one esbuild bundle with no
// code splitting, and an author needs the whole palette anyway.
import "@bitflow/start-simple";
import "@bitflow/title-simple";
import "@bitflow/input-markdown";
import "@bitflow/task-choice";
import "@bitflow/task-yes-no";
import "@bitflow/task-input";
import "@bitflow/task-fill-in-the-blank";
import "@bitflow/task-highlighting";
import "@bitflow/end-tries";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

interface VSCodeApi {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}

declare function acquireVsCodeApi(): VSCodeApi;
const vscode = acquireVsCodeApi();

type HostMessage =
  | { type: "update"; content: string }
  | { type: "flush" }
  | { type: "togglePreview" };

/** Long enough that a drag is one edit, short enough to feel immediate. */
const EDIT_DEBOUNCE = 250;

/**
 * The editor, wired to the document VS Code is holding.
 *
 * Every authoring change is sent to the extension, which writes it into the
 * document — that is what marks the tab dirty, and what makes Ctrl+S save the
 * assessment without this webview having a save of its own.
 */
function WebviewEditor() {
  const [flow, setFlow] = useState<string | undefined>(undefined);
  const [previewing, setPreviewing] = useState(false);

  /** The newest document, whether or not the debounce has fired for it yet. */
  const pending = useRef<BitflowDocument | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((type: "edit" | "flushed" | "save") => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    vscode.postMessage({ type, content: pending.current });
  }, []);

  const onSave = useCallback(
    (next: BitflowDocument) => {
      pending.current = next;
      send("save");
    },
    [send],
  );

  const onEdit = useCallback(
    (next: BitflowDocument) => {
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => send("edit"), EDIT_DEBOUNCE);
    },
    [send],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>) => {
      const message = event.data;
      if (message.type === "update") {
        // The document changed under us — someone edited the source, or undid
        // something there. Whatever is in the file wins.
        pending.current = null;
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        setFlow(message.content);
      } else if (message.type === "flush") {
        // A save is waiting on the keystroke the debounce is still holding.
        send("flushed");
      } else if (message.type === "togglePreview") {
        setPreviewing((on) => !on);
      }
    };

    window.addEventListener("message", onMessage);
    vscode.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", onMessage);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [send]);

  if (flow === undefined) {
    return <div style={{ padding: "20px" }}>Loading the assessment…</div>;
  }

  if (previewing) {
    // The flow as it stands right now, including edits the debounce has not
    // written to the document yet — previewing your last change is the point.
    const parsed = parseFlow(pending.current ?? flow);
    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        {parsed.ok ? (
          // No `attempt` and no persistence: a preview is a throwaway run, and
          // must not leave a half-finished attempt behind for anyone.
          <Flow flow={parsed.value} />
        ) : (
          <div style={{ padding: "20px" }} role="alert">
            {parsed.error.message}
          </div>
        )}
      </div>
    );
  }

  return <FlowEditor flow={flow} onEdit={onEdit} onSave={onSave} />;
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<WebviewEditor />);
}
