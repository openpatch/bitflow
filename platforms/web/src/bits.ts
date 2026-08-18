import { exampleFor, examples } from "./examples";

/*
 * The gallery loads exactly one task type: the one being shown.
 *
 * Its own import map rather than `loadBits` from `@bitflow/web-component`.
 * That package's entry also defines the flow and the editor, so importing
 * anything from it drags `@xyflow/react` along — 68 kB of authoring canvas on
 * a page showing a single question. The map is written out literally for the
 * same reason bitflow's own is: a computed specifier would defeat the
 * bundler's splitting and pull every task type into one file.
 */
const loaders: Record<string, () => Promise<unknown>> = {
  "task-choice": () => import("@bitflow/task-choice"),
  "task-yes-no": () => import("@bitflow/task-yes-no"),
  "task-input": () => import("@bitflow/task-input"),
  "task-fill-in-the-blank": () => import("@bitflow/task-fill-in-the-blank"),
  "task-highlighting": () => import("@bitflow/task-highlighting"),
  "task-drag-drop": () => import("@bitflow/task-drag-drop"),
  "task-find-hotspots": () => import("@bitflow/task-find-hotspots"),
  "task-ordering": () => import("@bitflow/task-ordering"),
  "task-matching": () => import("@bitflow/task-matching"),
  "task-parsons": () => import("@bitflow/task-parsons"),
  "task-crossword": () => import("@bitflow/task-crossword"),
  "task-word-search": () => import("@bitflow/task-word-search"),
};

const params = new URLSearchParams(location.search);
const example = exampleFor(params.get("type"));

const nav = document.querySelector("#types")!;
const stage = document.querySelector("#stage")!;
const shows = document.querySelector("#shows")!;
const source = document.querySelector("#source")!;
const code = document.querySelector("#code")!;
const log = document.querySelector("#log")!;

document.title = `${example.name} — bitflow`;
(document.querySelector("#name") as HTMLElement).textContent = example.name;
shows.textContent = example.shows;

for (const entry of examples) {
  const link = document.createElement("a");
  link.href = `./bits.html?type=${entry.type}`;
  link.textContent = entry.name;
  link.className =
    entry.type === example.type ? "chip chip-current" : "chip";
  if (entry.type === example.type) link.setAttribute("aria-current", "page");
  nav.append(link);
}

source.textContent = JSON.stringify(example.data, null, 2);
code.textContent = `import "@bitflow/${example.type}";

const task = document.querySelector("bitflow-${example.type}");
task.data = { /* the JSON below */ };

task.addEventListener("bitflow-answerchange", (e) => e.detail.answer);
task.addEventListener("bitflow-evaluated", (e) => e.detail.result);`;

const note = (message: string) => {
  log.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${log.textContent}`;
};

const load = loaders[example.type];
if (!load) {
  stage.textContent = `No task type called ${example.type} is built into this page.`;
} else {
  await load();
  const task = document.createElement(`bitflow-${example.type}`) as HTMLElement & {
    data: unknown;
    locale: string;
  };
  task.data = example.data;
  task.locale = "en";

  task.addEventListener("bitflow-answerchange", () => note("answer change"));
  task.addEventListener("bitflow-evaluated", (event) => {
    const { result } = (event as CustomEvent).detail;
    const score = result.score
      ? `, scoring ${result.score.earned} of ${result.score.possible}`
      : "";
    note(`evaluated — ${result.state}${score}`);
  });

  stage.append(task);
}
