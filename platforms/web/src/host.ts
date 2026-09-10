// The report element for class statistics, and the bit loaders so the host
// can name the steps it is offering locks for. `<bitflow-flow>` is defined too,
// but unused here — the host watches, it does not take.
import "@bitflow/web-component/report";
import { bitTypesIn, loadBits } from "@bitflow/web-component/flow";
import { createId, getBit, parseFlow, type BitflowDocument } from "@bitflow/core";
import type { Participant } from "bitflow-party/protocol";
import { createRoomCode, LiveSession } from "./session";

const which = document.querySelector("#which") as HTMLSelectElement;
const urlInput = document.querySelector("#url") as HTMLInputElement;
const startButton = document.querySelector("#start") as HTMLButtonElement;
const setupError = document.querySelector("#setup-error") as HTMLElement;
const setup = document.querySelector("#setup") as HTMLElement;
const running = document.querySelector("#running") as HTMLElement;
const codeEl = document.querySelector("#code")!;
const joinLink = document.querySelector("#join-link") as HTMLAnchorElement;
const emptyBoard = document.querySelector("#empty-board") as HTMLElement;
const board = document.querySelector("#board") as HTMLTableElement;
const boardBody = board.querySelector("tbody")!;
const group = document.querySelector("bitflow-group-report") as HTMLElement & {
  reports: unknown;
};
const locksList = document.querySelector("#locks")!;

let doc: BitflowDocument | null = null;
let session: LiveSession | null = null;
let locks: string[] = [];

/** Fetches the URL and turns a failure into a message the teacher can act on. */
const fetchDoc = async (url: string): Promise<BitflowDocument> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Could not reach "${url}". Is it online, and does it allow CORS?`);
  }
  if (!response.ok) {
    throw new Error(`Loading "${url}" failed with status ${response.status}.`);
  }
  return (await response.json()) as BitflowDocument;
};

const showSetupError = (message: string) => {
  setupError.textContent = message;
  setupError.hidden = false;
};

const stepName = (nodeId: string | undefined): string => {
  if (!nodeId || !doc) return "—";
  const node = doc.nodes.find((n) => n.id === nodeId);
  if (!node) return "—";
  return getBit(node.type)?.info("en").name ?? node.type;
};

const counts = (participant: Participant): { correct: number; wrong: number } => {
  let correct = 0;
  let wrong = 0;
  for (const report of participant.report?.nodeReports ?? []) {
    if (report.result?.state === "correct") correct++;
    else if (report.result?.state === "wrong") wrong++;
  }
  return { correct, wrong };
};

const renderBoard = (participants: Participant[]) => {
  const students = participants.filter((p) => p.role === "student");
  emptyBoard.hidden = students.length > 0;
  board.hidden = students.length === 0;

  boardBody.innerHTML = "";
  for (const student of students) {
    const row = boardBody.insertRow();
    row.innerHTML = `
      <th scope="row">${escapeHtml(student.name ?? student.id)}</th>
      <td>${stepName(student.currentNodeId)}</td>
      <td>${student.progress.visited}/${student.progress.total || "?"}</td>
      <td>${student.report?.score ? `${student.report.score.earned}/${student.report.score.possible}` : "—"}</td>
      <td>${counts(student).correct} / ${counts(student).wrong}</td>
      <td>${student.connected ? "yes" : "no"}</td>`;
  }
};

const renderLocks = () => {
  if (!doc) return;
  locksList.innerHTML = "";
  doc.nodes.forEach((node, index) => {
    const name = getBit(node.type)?.info("en").name ?? node.type;
    const li = document.createElement("li");
    li.className = "row";
    li.innerHTML = `
      <label>
        <input type="checkbox" data-id="${escapeHtml(node.id)}" ${locks.includes(node.id) ? "checked" : ""} />
        ${index + 1}. ${escapeHtml(name)}
      </label>`;
    locksList.append(li);
  });
  locksList
    .querySelectorAll<HTMLInputElement>("input[data-id]")
    .forEach((box) =>
      box.addEventListener("change", () => {
        const id = box.dataset.id!;
        locks = locks.includes(id) ? locks.filter((l) => l !== id) : [...locks, id];
        session?.setLocks(locks);
      }),
    );
};

const collectedReports = (participants: Participant[]): unknown[] =>
  participants
    .filter((p) => p.role === "student" && p.report)
    .map((p) => p.report);

const start = async () => {
  setupError.hidden = true;
  const url = urlInput.value.trim() || which.value;

  let parsed;
  try {
    const fetched = await fetchDoc(url);
    parsed = parseFlow(fetched);
  } catch (error) {
    showSetupError(error instanceof Error ? error.message : String(error));
    return;
  }
  if (!parsed.ok) {
    showSetupError(`That URL did not contain a valid bitflow document.`);
    return;
  }

  doc = parsed.value;
  // Only the types this document uses. Step names come from getBit(type), which
  // is empty until the bit is registered — so the locks panel waits on this.
  await loadBits(bitTypesIn(doc));

  const room = createRoomCode();
  const flowUrl = new URL(url, location.href).toString();
  session = new LiveSession(
    "host",
    createId("host"),
    room,
    undefined,
    {
      // The session frame carries the flow and the locks and nothing else; the
      // board arrives separately, and only because this page is the host.
      onSession: (flow, serverLocks) => {
        if (flow) {
          codeEl.textContent = room;
          joinLink.href = `./join.html?room=${room}`;
          joinLink.textContent = `join.html?room=${room}`;
        }
        locks = serverLocks;
        renderLocks();
      },
      onParticipants: (participants) => {
        renderBoard(participants);
        group.reports = collectedReports(participants);
      },
      onLocks: (nodeIds) => {
        locks = nodeIds;
        renderLocks();
      },
      onError: (message) => showSetupError(message),
    },
  );

  // The flow itself never reaches the server; only its id, version, title and
  // URL do. Send them once the session is open.
  session.setFlow({
    flowUrl,
    flowId: doc.meta.id,
    flowSchemaVersion: doc.version,
    title: doc.meta.title,
  });

  setup.hidden = true;
  running.hidden = false;
};

startButton.addEventListener("click", () => void start());
which.addEventListener("change", () => {
  urlInput.value = which.value;
});

/**
 * Escapes for both text and attribute contexts.
 *
 * The quotes matter: node ids come out of a document fetched from a URL the
 * teacher typed, the schema puts no restriction on what is in one, and
 * `renderLocks` interpolates one into `data-id="…"`. Without them an id
 * carrying a quote closes the attribute and writes markup on the board.
 */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
