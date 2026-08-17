import { hasBit } from "@bitflow/core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bitTypesIn, loadBits } from "./bitLoaders";
import "./index";

/**
 * The stable custom-element contract, driven the way a host page drives it:
 * properties in, events out, methods on the element.
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
      id: "start",
      type: "start-simple",
      position: { x: 0, y: 0 },
      data: { title: "Welcome", markdown: "Let us begin." },
    },
    {
      id: "q1",
      type: "task-yes-no",
      position: { x: 0, y: 100 },
      data: {
        question: "Is Paris the capital of France?",
        correctAnswer: true,
        evaluation: { mode: "auto", enableRetry: false, showFeedback: true },
      },
    },
    {
      id: "end",
      type: "end-tries",
      position: { x: 0, y: 200 },
      data: { title: "Done", markdown: "", showBreakdown: true, showScore: true },
    },
  ],
  edges: [
    { id: "e1", source: "start", target: "q1" },
    { id: "e2", source: "q1", target: "end" },
  ],
};

const flush = async (times = 6) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

/**
 * Waits for a condition rather than a fixed number of ticks: the first mount
 * resolves the bits' dynamic imports, which takes longer than any later one.
 */
const waitFor = async (predicate: () => boolean, attempts = 100) => {
  for (let i = 0; i < attempts; i++) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error("timed out waiting for the element to settle");
};

type FlowElement = HTMLElement &
  Record<string, unknown> & {
    save: () => unknown;
    reset: () => void;
  };

const mountFlow = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-flow") as FlowElement;
  Object.assign(element, { flow, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

/** Mounts and waits until the bits have loaded and the flow has rendered. */
const mountLoadedFlow = async (props: Record<string, unknown> = {}) => {
  const element = await mountFlow(props);
  await waitFor(() => element.querySelectorAll("button").length > 0);
  return element;
};

const button = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll("button")].find((b) => b.textContent === label);

afterEach(() => document.body.replaceChildren());

describe("bit loading", () => {
  it("lists the distinct types a document uses", () => {
    expect(bitTypesIn(flow).sort()).toEqual([
      "end-tries",
      "start-simple",
      "task-yes-no",
    ]);
  });

  it("survives a document that is not one", () => {
    expect(bitTypesIn(null)).toEqual([]);
    expect(bitTypesIn({ nodes: "no" })).toEqual([]);
  });

  it("loads only the bits it is asked for", async () => {
    await loadBits(["task-choice"]);
    expect(hasBit("task-choice")).toBe(true);
    // Never referenced, never loaded.
    expect(hasBit("task-highlighting")).toBe(false);
  });

  it("reports a type it has no loader for instead of throwing", async () => {
    expect(await loadBits(["no-such-bit"])).toEqual(["no-such-bit"]);
  });
});

describe("<bitflow-flow>", () => {
  beforeAll(() => {
    expect(customElements.get("bitflow-flow")).toBeDefined();
  });

  it("renders the flow once its bits have loaded", async () => {
    const element = await mountLoadedFlow();
    expect(element.textContent).toContain("Welcome");
  });

  it("loads the bits the document names, and no others", async () => {
    await mountFlow();
    expect(hasBit("start-simple")).toBe(true);
    expect(hasBit("task-yes-no")).toBe(true);
    expect(hasBit("end-tries")).toBe(true);
    expect(hasBit("task-fill-in-the-blank")).toBe(false);
  });

  it("emits nothing merely for being given a flow", async () => {
    const listener = vi.fn();
    document.addEventListener("bitflow-statechange", listener);
    await mountFlow();
    expect(listener).not.toHaveBeenCalled();
    document.removeEventListener("bitflow-statechange", listener);
  });

  it("emits a full snapshot on every durable change", async () => {
    const element = await mountLoadedFlow();
    const listener = vi.fn();
    document.addEventListener("bitflow-statechange", listener);

    button(element, "Next")?.click();
    await flush();

    expect(listener).toHaveBeenCalled();
    const snapshot = listener.mock.calls.at(-1)?.[0].detail;
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      flowId: "flow-1",
      currentNodeId: "q1",
      status: "inProgress",
    });
    document.removeEventListener("bitflow-statechange", listener);
  });

  it("bubbles and composes its events so a host page hears them", async () => {
    const element = await mountLoadedFlow();
    const captured: Event[] = [];
    document.addEventListener("bitflow-statechange", (event) => captured.push(event));

    button(element, "Next")?.click();
    await flush();

    const event = captured.at(-1) as CustomEvent;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("emits bitflow-save with the snapshot when save() is called", async () => {
    const element = await mountLoadedFlow();
    const listener = vi.fn();
    document.addEventListener("bitflow-save", listener);

    const returned = element.save();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual(returned);
    expect(returned).toMatchObject({ flowId: "flow-1" });
    document.removeEventListener("bitflow-save", listener);
  });

  it("starts over when reset() is called", async () => {
    const element = await mountLoadedFlow();
    button(element, "Next")?.click();
    await flush();
    expect(element.textContent).toContain("Paris");

    element.reset();
    await flush();

    expect(element.textContent).toContain("Welcome");
  });

  it("emits bitflow-complete with both the attempt and its report", async () => {
    const element = await mountLoadedFlow();
    const listener = vi.fn();
    document.addEventListener("bitflow-complete", listener);

    button(element, "Next")?.click();
    await flush();
    (element.querySelectorAll("input")[0] as HTMLInputElement).click();
    await flush();
    button(element, "Check")?.click();
    await flush();
    button(element, "Next")?.click();
    await flush();

    expect(listener).toHaveBeenCalledOnce();
    const { attempt, report } = listener.mock.calls[0][0].detail;
    expect(attempt.status).toBe("completed");
    expect(report.schemaVersion).toBe(1);
    expect(report.nodeReports).toHaveLength(1);
    expect(report.score).toEqual({ earned: 1, possible: 1 });
    document.removeEventListener("bitflow-complete", listener);
  });

  describe("attempt restore", () => {
    /** Answers the first question and returns the resulting snapshot. */
    const halfway = async () => {
      const element = await mountLoadedFlow();
      const listener = vi.fn();
      document.addEventListener("bitflow-statechange", listener);

      button(element, "Next")?.click();
      await flush();
      (element.querySelectorAll("input")[0] as HTMLInputElement).click();
      await flush();
      button(element, "Check")?.click();
      await flush();

      const snapshot = listener.mock.calls.at(-1)?.[0].detail;
      document.removeEventListener("bitflow-statechange", listener);
      element.remove();
      return snapshot;
    };

    it("resumes at the same node with the answer and result intact", async () => {
      const snapshot = await halfway();
      const element = await mountLoadedFlow({ attempt: snapshot });

      expect(element.textContent).toContain("Paris");
      expect(element.textContent).toContain("Correct");
    });

    it("emits bitflow-error and keeps the current attempt for a wrong flow", async () => {
      const snapshot = await halfway();
      const listener = vi.fn();
      document.addEventListener("bitflow-error", listener);

      const element = await mountLoadedFlow({
        attempt: { ...snapshot, flowId: "some-other-flow" },
      });

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].detail.code).toBe("FLOW_ATTEMPT_MISMATCH");
      // Still on the fresh attempt's first node.
      expect(element.textContent).toContain("Welcome");
      document.removeEventListener("bitflow-error", listener);
    });

    it("emits bitflow-error for a snapshot that is not one", async () => {
      const listener = vi.fn();
      document.addEventListener("bitflow-error", listener);

      await mountFlow({ attempt: { schemaVersion: 1 } });

      expect(listener.mock.calls[0][0].detail.code).toBe("INVALID_ATTEMPT");
      document.removeEventListener("bitflow-error", listener);
    });
  });

  it("emits bitflow-error for a document that is not a flow", async () => {
    const listener = vi.fn();
    document.addEventListener("bitflow-error", listener);

    await mountFlow({ flow: { version: 1, nodes: [] } });

    expect(listener.mock.calls[0][0].detail.code).toBe("INVALID_FLOW");
    document.removeEventListener("bitflow-error", listener);
  });

  it("names the task types it cannot show", async () => {
    const listener = vi.fn();
    document.addEventListener("bitflow-error", listener);

    await mountFlow({
      flow: {
        ...flow,
        nodes: [
          ...flow.nodes,
          { id: "x", type: "task-from-the-future", position: { x: 0, y: 0 }, data: {} },
        ],
      },
    });

    const error = listener.mock.calls[0][0].detail;
    expect(error.code).toBe("UNKNOWN_BIT_TYPE");
    expect(error.message).toContain("task-from-the-future");
    document.removeEventListener("bitflow-error", listener);
  });

  it("accepts a flow as JSON text", async () => {
    const element = await mountLoadedFlow({ flow: JSON.stringify(flow) });
    expect(element.textContent).toContain("Welcome");
  });
});

describe("<bitflow-report>", () => {
  it("renders raw result data with no flow in sight", async () => {
    const element = document.createElement("bitflow-report") as HTMLElement &
      Record<string, unknown>;
    element.report = {
      schemaVersion: 1,
      flowId: "flow-1",
      flowSchemaVersion: 1,
      attemptId: "a-1",
      status: "completed",
      nodeReports: [
        {
          nodeId: "q1",
          bitType: "task-yes-no",
          answer: { yes: true },
          result: { state: "correct" },
          tries: 1,
        },
      ],
      score: { earned: 1, possible: 1 },
      startedAt: "2026-01-01T10:00:00.000Z",
      completedAt: "2026-01-01T10:01:00.000Z",
    };
    element.locale = "en";
    document.body.append(element);
    await flush();

    expect(element.textContent).toContain("1 of 1 points");
  });
});

describe("defining an element twice", () => {
  it("is harmless", async () => {
    // A page may load both the "everything" bundle and a single-surface one.
    await expect(import("./flow")).resolves.toBeDefined();
    await expect(import("./report")).resolves.toBeDefined();
    expect(customElements.get("bitflow-flow")).toBeDefined();
  });
});
