import { registerBit, type BitTaskProps } from "@bitflow/core";
import { createElement } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import "./index";

/**
 * A stand-in for whatever task the learner answered. Registered here rather
 * than pulled in from a real bit package: end-tries must not depend on one, or
 * the dependency direction that keeps bits lazily loadable would be inverted.
 */
beforeAll(() => {
  registerBit<{ question: string }, { yes: boolean }>({
    type: "test-question",
    kind: "task",
    schema: z.object({ question: z.string() }),
    defaultData: () => ({ question: "" }),
    info: () => ({ name: "Question", description: "" }),
    evaluate: () => ({ state: "correct" }),
    Task: ({ data, answer, readonly }: BitTaskProps<{ question: string }, { yes: boolean }>) =>
      createElement("label", null, data.question,
        createElement("input", {
          type: "radio",
          checked: answer?.yes === true,
          disabled: readonly,
          readOnly: true,
        }),
      ),
  });
});

const data = {
  title: "Well done",
  markdown: "You finished the **whole** assessment.",
  showBreakdown: true,
  showScore: true,
  allowReview: false,
};

/** The document the attempt belongs to; review needs it to find the tasks. */
const flow = {
  version: 1,
  meta: {
    id: "flow-1",
    title: "Test",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
  },
  nodes: [
    {
      id: "q1",
      type: "test-question",
      position: { x: 0, y: 0 },
      data: { question: "Is Paris the capital of France?" },
    },
    {
      id: "q2",
      type: "test-question",
      position: { x: 0, y: 100 },
      data: { question: "Is Rome the capital of Spain?" },
    },
  ],
  edges: [{ id: "e1", source: "q1", target: "q2" }],
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
  answers: { q1: { yes: true }, q2: { yes: true } },
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

  describe("reviewing an answer", () => {
    it("offers nothing to open unless the author allowed it", async () => {
      const element = await mount({ attempt, flow });
      expect(element.textContent).not.toContain("See your answer");
    });

    it("needs the document, not just the attempt", async () => {
      // Without the flow there is no way to know which task an id was.
      const element = await mount({
        data: { ...data, allowReview: true },
        attempt,
      });
      expect(element.textContent).not.toContain("See your answer");
    });

    it("opens the task the learner picked, with their answer", async () => {
      const element = await mount({
        data: { ...data, allowReview: true },
        attempt,
        flow,
      });

      const open = [...element.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("See your answer"),
      );
      expect(open).toBeDefined();
      open!.click();
      await flush();

      // The real task, showing what they said.
      expect(element.textContent).toContain("Is Paris the capital of France?");
      const yes = element.querySelector('input[type="radio"]') as HTMLInputElement;
      expect(yes.checked).toBe(true);
    });

    it("will not let them change it", async () => {
      const element = await mount({
        data: { ...data, allowReview: true },
        attempt,
        flow,
      });
      [...element.querySelectorAll("button")]
        .find((b) => b.textContent?.includes("See your answer"))!
        .click();
      await flush();

      const inputs = [...element.querySelectorAll("input")];
      expect(inputs.length).toBeGreaterThan(0);
      expect(inputs.every((input) => input.disabled)).toBe(true);
    });

    it("shows one task at a time, and closes again", async () => {
      const element = await mount({
        data: { ...data, allowReview: true },
        attempt,
        flow,
      });
      const openers = () =>
        [...element.querySelectorAll("button")].filter((b) =>
          /See your answer|Hide/.test(b.textContent ?? ""),
        );

      openers()[0].click();
      await flush();
      expect(element.textContent).toContain("Is Paris the capital of France?");

      openers()[1].click();
      await flush();
      expect(element.textContent).toContain("Is Rome the capital of Spain?");
      expect(element.textContent).not.toContain("Is Paris the capital of France?");

      openers()[1].click();
      await flush();
      expect(element.textContent).not.toContain("Is Rome the capital of Spain?");
    });

    it("says which row is open, for anyone not looking at it", async () => {
      const element = await mount({
        data: { ...data, allowReview: true },
        attempt,
        flow,
      });
      const row = [...element.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("See your answer"),
      )!;
      expect(row.getAttribute("aria-expanded")).toBe("false");

      row.click();
      await flush();

      expect(
        [...element.querySelectorAll("button")]
          .find((b) => b.textContent?.includes("Hide"))!
          .getAttribute("aria-expanded"),
      ).toBe("true");
    });
  });
});
