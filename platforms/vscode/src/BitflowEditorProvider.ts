import * as vscode from "vscode";

/**
 * The custom editor behind `.bitflow` files.
 *
 * The `TextDocument` stays the single source of truth: every authoring change
 * in the webview is written straight into it, which is what makes VS Code's own
 * dirty marker, its undo stack and plain Ctrl+S work without this extension
 * reimplementing any of them.
 */
export class BitflowEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "bitflow.editor";

  /**
   * Every open editor, so the `bitflow.showPreview` command can reach the one
   * the user is looking at. Keyed by document URI.
   */
  private static readonly panels = new Map<string, vscode.WebviewPanel>();

  /** Flips the editor the user is looking at into or out of preview mode. */
  public static togglePreview(uri: vscode.Uri): boolean {
    const panel = BitflowEditorProvider.panels.get(uri.toString());
    if (!panel) return false;
    panel.webview.postMessage({ type: "togglePreview" });
    return true;
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    BitflowEditorProvider.panels.set(document.uri.toString(), webviewPanel);

    const post = (message: unknown) => webviewPanel.webview.postMessage(message);

    /**
     * The text this editor last wrote itself.
     *
     * A change event carrying it is our own edit coming back around, and
     * reloading the webview from it would throw away the author's selection and
     * whatever the canvas was in the middle of.
     */
    let ownEdit: string | null = null;

    /** Resolves the pending flush when the webview answers one. */
    let resolveFlush: ((text: string | null) => void) | null = null;

    const serialize = (flow: unknown) => `${JSON.stringify(flow, null, 2)}\n`;

    const writeToDocument = async (flow: unknown) => {
      const text = serialize(flow);
      if (document.getText() === text) return;

      ownEdit = text;
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        text,
      );
      await vscode.workspace.applyEdit(edit);
    };

    /**
     * The webview's latest document, whether or not its debounce has fired.
     *
     * Saving has to catch the keystroke from a moment ago, so the save waits
     * for an answer rather than hoping one arrives — and gives up after half a
     * second rather than blocking the save if the webview is wedged.
     */
    const flush = () =>
      new Promise<string | null>((resolve) => {
        const timer = setTimeout(() => {
          resolveFlush = null;
          resolve(null);
        }, 500);
        resolveFlush = (text) => {
          clearTimeout(timer);
          resolveFlush = null;
          resolve(text);
        };
        post({ type: "flush" });
      });

    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;
      if (e.contentChanges.length === 0) return;

      if (e.document.getText() === ownEdit) {
        ownEdit = null;
        return;
      }
      ownEdit = null;
      post({ type: "update", content: e.document.getText() });
    });

    // Returning the edit from `waitUntil` is how VS Code wants a document
    // amended on the way to disk; applying one from here would race the save.
    const willSaveSubscription = vscode.workspace.onWillSaveTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;

      e.waitUntil(
        flush().then((text) => {
          if (text === null || text === document.getText()) return [];
          ownEdit = text;
          return [
            vscode.TextEdit.replace(
              new vscode.Range(0, 0, document.lineCount, 0),
              text,
            ),
          ];
        }),
      );
    });

    const messageSubscription = webviewPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "ready":
            post({ type: "update", content: document.getText() });
            return;
          case "edit":
            await writeToDocument(message.content);
            return;
          case "save":
            // The editor's own Save button. VS Code owns saving, so this writes
            // the document and then asks VS Code to do exactly what Ctrl+S does.
            await writeToDocument(message.content);
            await document.save();
            return;
          case "flushed":
            resolveFlush?.(serialize(message.content));
            return;
        }
      },
    );

    webviewPanel.onDidDispose(() => {
      BitflowEditorProvider.panels.delete(document.uri.toString());
      changeSubscription.dispose();
      willSaveSubscription.dispose();
      messageSubscription.dispose();
      resolveFlush?.(null);
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
    );
    const nonce = getNonce();

    // The policy allows exactly one script, identified by its nonce, plus
    // inline styles (the packages inject their own) and inlined images and
    // fonts. No external source of anything — a `.bitflow` file is untrusted
    // input, and a webview with a permissive policy is the obvious way for
    // that to matter.
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource} data:;">
  <title>Bitflow</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const array = new Uint32Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }
  return Array.from(array, (num) => num.toString(16).padStart(8, "0")).join("");
}
