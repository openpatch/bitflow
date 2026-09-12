import "@bitflow/web-component/editor";

const editor = document.querySelector("bitflow-flow-editor") as HTMLElement & {
  src: string;
  getFlow: () => any;
  validate: () => { valid: boolean; diagnostics: Array<{ message: string }> };
};
const log = document.querySelector("#log")!;

const note = (message: string) => {
  log.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${log.textContent}`;
};

// The one with sections, a shuffled pool, a loop and a confidence branch —
// the flow-control settings are only worth looking at on a flow that uses them.
editor.src = "adaptive.bitflow";

editor.addEventListener("bitflow-edit", (event) => {
  const { flow } = (event as CustomEvent).detail;
  note(`edit — ${flow.nodes.length} step(s), ${flow.edges.length} connection(s)`);
});

editor.addEventListener("bitflow-save", () => note("save"));

editor.addEventListener("bitflow-error", (event) => {
  const error = (event as CustomEvent).detail;
  note(`error ${error.code}: ${error.message}`);
});

document.querySelector("#validate")!.addEventListener("click", () => {
  const result = editor.validate();
  note(
    result.valid
      ? "no problems found"
      : result.diagnostics.map((d) => `• ${d.message}`).join("\n"),
  );
});

// The host owns where a document goes. Here that is a download; elsewhere it
// might be a PUT, a git commit, or a VS Code TextDocument.
document.querySelector("#download")!.addEventListener("click", () => {
  const flow = editor.getFlow();
  const blob = new Blob([`${JSON.stringify(flow, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${flow.meta.id || "assessment"}.bitflow`;
  link.click();
  URL.revokeObjectURL(url);
});
