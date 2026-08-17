import { afterEach, describe, expect, it } from "vitest";
import "./index";

const data = {
  title: "Well done",
  markdown: "You finished the **whole** assessment.",
  showBreakdown: true,
  showScore: true,
};

/** What the flow hands an end bit after a completed run. */
const attempt = {
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  status: "completed",
  currentNodeId: "end",
  history: ["q1", "q2", "end"],
  answers: {},
  results: {
    q1: { state: "correct" },
    q2: { state: "wrong" },
  },
  tries: { q1: 1, q2: 3 },
  elapsedMs: {},
  startedAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:05:00.000Z",
  enteredAt: "2026-01-01T10:05:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-end-tries") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-end-tries>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-end-tries")).toBeDefined();
  });

  it("renders the closing message on its own", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Well done");
    expect(element.querySelector("strong")?.textContent).toBe("whole");
  });

  it("shows the score and per-task outcomes when given an attempt", async () => {
    const element = await mount({ attempt });
    expect(element.textContent).toContain("1 of 2 points");
    expect(element.textContent).toContain("Correct");
    expect(element.textContent).toContain("Not correct");
    expect(element.textContent).toContain("3 attempt(s)");
  });

  it("hides the breakdown when the author turned it off", async () => {
    const element = await mount({
      data: { ...data, showBreakdown: false },
      attempt,
    });
    expect(element.textContent).not.toContain("Your answers");
    expect(element.textContent).toContain("1 of 2 points");
  });

  it("shows only the message when there is no attempt, as in an author preview", async () => {
    const element = await mount();
    expect(element.textContent).not.toContain("points");
    expect(element.textContent).not.toContain("Your answers");
  });
});
