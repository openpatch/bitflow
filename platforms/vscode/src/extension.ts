import * as vscode from "vscode";
import { BitflowEditorProvider } from "./BitflowEditorProvider";

/** What a brand new `.bitflow` file contains: a start screen and an end. */
const emptyFlow = (id: string, title: string) => ({
  version: 1,
  meta: {
    id,
    title,
    locale: "en",
    askConfidence: false,
    askReasoning: false,
  },
  nodes: [
    {
      id: "start",
      type: "start-simple",
      position: { x: 0, y: 0 },
      data: { title, markdown: "" },
    },
    {
      id: "end",
      type: "end-tries",
      position: { x: 0, y: 200 },
      data: { title: "", markdown: "", showBreakdown: true, showScore: true },
    },
  ],
  edges: [{ id: "e-start-end", source: "start", target: "end" }],
});

/**
 * The `.bitflow` file the user is looking at.
 *
 * With a custom editor in front there is no active *text* editor, so the tab is
 * what has to be asked. Falling back to the text editor covers a file opened as
 * source.
 */
const activeFlowUri = (): vscode.Uri | undefined => {
  const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  const fromTab =
    input instanceof vscode.TabInputCustom || input instanceof vscode.TabInputText
      ? input.uri
      : undefined;
  const uri = fromTab ?? vscode.window.activeTextEditor?.document.uri;
  return uri?.path.endsWith(".bitflow") ? uri : undefined;
};

const requireFlowUri = (): vscode.Uri | undefined => {
  const uri = activeFlowUri();
  if (!uri) vscode.window.showErrorMessage("No .bitflow file is open.");
  return uri;
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      BitflowEditorProvider.viewType,
      new BitflowEditorProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bitflow.new", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showErrorMessage(
          "Open a folder or workspace before creating an assessment.",
        );
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: "Name for the new assessment",
        placeHolder: "fractions-check",
        validateInput: (value) => {
          if (!value) return "A name is required";
          if (!/^[a-zA-Z0-9 _-]+$/.test(value)) {
            return "Use letters, numbers, spaces, hyphens and underscores";
          }
          return null;
        },
      });
      if (!name) return;

      const uri = vscode.Uri.joinPath(folder.uri, `${name}.bitflow`);
      try {
        await vscode.workspace.fs.stat(uri);
        vscode.window.showErrorMessage(`${name}.bitflow already exists.`);
        return;
      } catch {
        // Does not exist yet, which is what we want.
      }

      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(`${JSON.stringify(emptyFlow(name, name), null, 2)}\n`, "utf8"),
      );
      await vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        BitflowEditorProvider.viewType,
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bitflow.showSource", async () => {
      const uri = requireFlowUri();
      if (uri) await vscode.commands.executeCommand("vscode.openWith", uri, "default");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bitflow.showEditor", async () => {
      const uri = requireFlowUri();
      if (uri) {
        await vscode.commands.executeCommand(
          "vscode.openWith",
          uri,
          BitflowEditorProvider.viewType,
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bitflow.showPreview", async () => {
      const uri = requireFlowUri();
      if (!uri) return;

      // Preview lives inside the editor rather than in a second panel: it runs
      // the flow the author is editing right now, including changes the
      // debounce has not written to the document yet.
      if (!BitflowEditorProvider.togglePreview(uri)) {
        await vscode.commands.executeCommand(
          "vscode.openWith",
          uri,
          BitflowEditorProvider.viewType,
        );
      }
    }),
  );
}

export function deactivate() {}
