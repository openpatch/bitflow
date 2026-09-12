// Only the report elements. Nothing here pulls in the flow runtime, the editor
// or a task package.
import "@bitflow/web-component/report";

const report = document.querySelector("bitflow-report") as HTMLElement & {
  report: unknown;
};
const group = document.querySelector("bitflow-group-report") as HTMLElement & {
  reports: unknown;
};

report.report = await (await fetch("single-report.json")).json();
group.reports = await (await fetch("group-reports.json")).json();

/**
 * Result data can come from anywhere — exported files, pasted JSON, a service.
 * The component only ever computes from the array it is given, which is why
 * reading files off disk is enough to get a class overview.
 */
document.querySelector("#files")!.addEventListener("change", async (event) => {
  const files = [...((event.target as HTMLInputElement).files ?? [])];
  if (files.length === 0) return;

  const contents = await Promise.all(files.map((file) => file.text()));
  const reports = contents.flatMap((text) => {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  });

  group.reports = reports;
  report.report = reports[0];
});
