// `<bitflow-flow>` for taking the assessment, plus the bits the document uses.
import "@bitflow/web-component/flow";
import {
  flowProgress,
  parseFlow,
  type AttemptSnapshot,
  type BitflowDocument,
} from "@bitflow/core";
import {
  buildShareableReport,
  LiveSession,
  participantIdFor,
} from "./session";

const params = new URLSearchParams(location.search);
const room = params.get("room") ?? "";
const nameInput = document.querySelector("#name") as HTMLInputElement;
const joinButton = document.querySelector("#join-button") as HTMLButtonElement;
const joinError = document.querySelector("#join-error") as HTMLElement;
const joinSection = document.querySelector("#join") as HTMLElement;
const takingSection = document.querySelector("#taking") as HTMLElement;
const flow = document.querySelector("bitflow-flow") as HTMLElement & {
  flow?: unknown;
  lockedNodeIds?: string[];
};
const flowError = document.querySelector("#flow-error") as HTMLElement;

if (!room) {
  joinError.textContent = "No room code in the link. Ask your teacher for the join link.";
  joinError.hidden = false;
  joinButton.disabled = true;
}

let doc: BitflowDocument | null = null;
let name = "";
let session: LiveSession | null = null;

const showError = (el: HTMLElement) => (message: string) => {
  el.textContent = message;
  el.hidden = false;
};

/** Loads the flow from its URL. Fetched rather than assigned to `src` because
 *  the page needs the document object for `createReport`. */
const loadFlow = async (flowUrl: string): Promise<BitflowDocument | null> => {
  let response: Response;
  try {
    response = await fetch(flowUrl);
  } catch {
    showError(flowError)(`Could not reach the assessment at "${flowUrl}". It may be offline or block cross-origin requests.`);
    return null;
  }
  if (!response.ok) {
    showError(flowError)(`Loading the assessment failed with status ${response.status}.`);
    return null;
  }

  const parsed = parseFlow(await response.json());
  if (!parsed.ok) {
    showError(flowError)("The assessment at that URL is not a valid bitflow document.");
    return null;
  }
  return parsed.value;
};

const reportProgress = (snapshot: AttemptSnapshot) => {
  if (!doc || !session) return;
  const progress = flowProgress(doc, snapshot);
  const total = Number.isFinite(progress.remaining)
    ? progress.visited + progress.remaining
    : progress.visited;
  session.reportProgress(
    snapshot.status,
    snapshot.currentNodeId,
    progress.visited,
    total,
    buildShareableReport(doc, snapshot, { id: participantIdFor(room), label: name }),
  );
};

const join = async () => {
  joinError.hidden = true;
  name = nameInput.value.trim();
  if (!name) {
    showError(joinError)("Enter a name so your teacher can tell who is who.");
    return;
  }

  const participantId = participantIdFor(room);
  session = new LiveSession("student", participantId, room, name, {
    onSession: async (serverFlow, serverLocks) => {
      if (!serverFlow) return;
      if (!doc) {
        doc = await loadFlow(serverFlow.flowUrl);
        if (!doc) return;
        // The document must land before the attempt, and `lockedNodeIds` only
        // ever from the socket — see src/flow.ts for why the document first.
        flow.flow = doc;
        flow.lockedNodeIds = serverLocks;
        takingSection.hidden = false;
        joinSection.hidden = true;
      }
    },
    onLocks: (nodeIds) => {
      // Only ever from the socket: the host, not the learner, holds the list.
      flow.lockedNodeIds = nodeIds;
    },
    onError: (message) => showError(flowError)(message),
  });

  // Every durable change leaves the browser as a stripped report — results,
  // scores, tries and timings, never the answer itself.
  flow.addEventListener("bitflow-statechange", (event) => {
    reportProgress((event as CustomEvent).detail as AttemptSnapshot);
  });

  flow.addEventListener("bitflow-complete", (event) => {
    reportProgress((event as CustomEvent).detail.attempt as AttemptSnapshot);
  });

  flow.addEventListener("bitflow-error", (event) => {
    showError(flowError)((event as CustomEvent).detail.message);
  });
};

joinButton.addEventListener("click", () => void join());
nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void join();
});
