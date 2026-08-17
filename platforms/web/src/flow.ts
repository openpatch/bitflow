// Only the learner element. The editor and the report views are never loaded
// on this page.
import "@bitflow/web-component/flow";

const flow = document.querySelector("bitflow-flow") as HTMLElement & {
  src: string;
  attempt?: unknown;
  save: () => unknown;
  reset: () => void;
};
const log = document.querySelector("#log")!;
const which = document.querySelector("#which") as HTMLSelectElement;

const note = (message: string) => {
  log.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${log.textContent}`;
};

/**
 * The host's own database. bitflow never opens one: it has no way to know who
 * the learner is, which assignment this is, or how long results should be kept.
 */
const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("bitflow-demo", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("attempts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const db = await openDatabase();

const read = (key: string) =>
  new Promise<unknown>((resolve, reject) => {
    const request = db.transaction("attempts").objectStore("attempts").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const write = (key: string, value: unknown) =>
  new Promise<void>((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    tx.objectStore("attempts").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

/** The host's key, built from whatever identities the host actually has. */
const keyFor = (src: string) => `demo:${src}`;

const load = async (src: string) => {
  flow.src = src;
  const saved = await read(keyFor(src));
  if (saved) {
    flow.attempt = saved;
    note("resumed the attempt this browser had saved");
  } else {
    note("started a fresh attempt");
  }
};

// Debounced: a snapshot arrives on every answer, and IndexedDB writes are not
// free. A quarter of a second loses nothing that matters.
let pending: ReturnType<typeof setTimeout>;
flow.addEventListener("bitflow-statechange", (event) => {
  const snapshot = (event as CustomEvent).detail;
  clearTimeout(pending);
  pending = setTimeout(() => void write(keyFor(which.value), snapshot), 250);
  note(`state change — now at "${snapshot.currentNodeId}"`);
});

flow.addEventListener("bitflow-save", () => note("save"));

flow.addEventListener("bitflow-complete", (event) => {
  const { report } = (event as CustomEvent).detail;
  note(
    `complete — ${report.score.earned} of ${report.score.possible} points. ` +
      `The report travels with the event, ready to file.`,
  );
});

flow.addEventListener("bitflow-error", (event) => {
  const error = (event as CustomEvent).detail;
  note(`error ${error.code}: ${error.message}`);
});

document.querySelector("#reset")!.addEventListener("click", () => {
  flow.reset();
  void write(keyFor(which.value), undefined);
});

document.querySelector("#save")!.addEventListener("click", () => flow.save());

which.addEventListener("change", () => void load(which.value));

await load(which.value);
