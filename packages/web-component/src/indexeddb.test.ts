import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import "./index";

/**
 * The host-side persistence recipe from the handoff, run end to end.
 *
 * This is the test that guards the division of labour: bitflow never opens a
 * database, chooses a key, or decides when to write. A host listens for
 * `bitflow-statechange`, stores the snapshot under its own identifier, and
 * hands it back through the `attempt` property on the next visit.
 */

const flow = {
  version: 1,
  meta: {
    id: "flow-1",
    title: "Capitals",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
  },
  nodes: [
    {
      id: "q1",
      type: "task-yes-no",
      position: { x: 0, y: 0 },
      data: {
        question: "Is Paris the capital of France?",
        correctAnswer: true,
        evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
      },
    },
    {
      id: "q2",
      type: "task-yes-no",
      position: { x: 0, y: 100 },
      data: {
        question: "Is Rome the capital of Spain?",
        correctAnswer: false,
        evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
      },
    },
  ],
  edges: [{ id: "e1", source: "q1", target: "q2" }],
};

const KEY = "course-42:assignment-7:learner-9";

/** The host's own database. Nothing in bitflow knows it exists. */
const openHostDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open("host-app", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("attempts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const put = (db: IDBDatabase, value: unknown): Promise<void> =>
  new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    tx.objectStore("attempts").put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

const get = (db: IDBDatabase): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readonly");
    const request = tx.objectStore("attempts").get(KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const flush = async (times = 8) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

const waitFor = async (predicate: () => boolean, attempts = 100) => {
  for (let i = 0; i < attempts; i++) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error("timed out waiting for the element to settle");
};

type FlowElement = HTMLElement &
  Record<string, unknown> & { save: () => any };

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-flow") as FlowElement;
  Object.assign(element, { flow, locale: "en", ...props });
  document.body.append(element);
  await waitFor(() => element.querySelectorAll("button").length > 0);
  return element;
};

const button = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll("button")].find((b) => b.textContent === label);

describe("a bare host persisting to IndexedDB", () => {
  it("saves on state change, and resumes from what it saved", async () => {
    const db = await openHostDatabase();

    // --- first visit -------------------------------------------------------
    const first = await mount();
    const onStateChange = (event: Event) =>
      void put(db, (event as CustomEvent).detail);
    first.addEventListener("bitflow-statechange", onStateChange);

    // Answer the first question correctly and move on.
    (first.querySelectorAll("input")[0] as HTMLInputElement).click();
    await flush();
    button(first, "Check")?.click();
    await flush();
    button(first, "Next")?.click();
    await flush();

    expect(first.textContent).toContain("Rome");
    first.removeEventListener("bitflow-statechange", onStateChange);
    first.remove();

    // --- what the host stored ---------------------------------------------
    const stored = (await get(db)) as Record<string, unknown>;
    expect(stored).toMatchObject({
      flowId: "flow-1",
      currentNodeId: "q2",
      status: "inProgress",
    });
    expect(stored.answers).toEqual({ q1: { yes: true } });
    expect(stored.results).toMatchObject({ q1: { state: "correct" } });
    expect(stored.tries).toEqual({ q1: 1 });

    // --- second visit ------------------------------------------------------
    const second = await mount({ attempt: stored });

    // Same node, and the earlier answer is still on record.
    expect(second.textContent).toContain("Rome");
    const resumed = second.save();
    expect(resumed.currentNodeId).toBe("q2");
    expect(resumed.answers).toEqual({ q1: { yes: true } });
    expect(resumed.results.q1.state).toBe("correct");
    expect(resumed.tries.q1).toBe(1);
    expect(resumed.history).toEqual(["q1", "q2"]);

    second.remove();
    db.close();
  });

  it("keeps the fresh attempt when the stored snapshot is for another flow", async () => {
    const db = await openHostDatabase();
    const stored = (await get(db)) as Record<string, unknown>;

    const errors: unknown[] = [];
    document.addEventListener("bitflow-error", (event) =>
      errors.push((event as CustomEvent).detail),
    );

    const element = await mount({
      attempt: { ...stored, flowId: "a-different-assessment" },
    });

    expect(errors).toHaveLength(1);
    expect((errors[0] as { code: string }).code).toBe("FLOW_ATTEMPT_MISMATCH");
    // Back at the first question rather than half-restored into the second.
    expect(element.textContent).toContain("Paris");

    element.remove();
    db.close();
  });

  it("creates no database of its own", async () => {
    await mount();
    const databases = await indexedDB.databases();
    // Only the host's. Nothing bitflow-shaped.
    expect(databases.map((d) => d.name)).toEqual(["host-app"]);
  });
});
