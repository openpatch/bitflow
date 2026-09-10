import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
import { filenameOf, payloadOf, type Data } from "./schema";
import type { AttemptSnapshot } from "@bitflow/core";

const data: Data = {
  title: "All done",
  markdown: "Keep a **copy** for yourself.",
  buttonLabel: "",
  filename: "my results",
  includeAnswers: true,
};

const attempt = {
  schemaVersion: 1,
  flowId: "flow-1",
  flowSchemaVersion: 1,
  attemptId: "attempt-1",
  status: "completed",
  currentNodeId: "end",
  history: ["q1", "end"],
  answers: { q1: { text: "Paris" } },
  results: { q1: { state: "correct" } },
  tries: { q1: 1 },
  elapsedMs: { q1: 4000 },
  pools: {},
  reasoning: { q1: "I remembered the map." },
  confidence: { q1: { level: 0.8 } },
  startedAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:05:00.000Z",
  enteredAt: "2026-01-01T10:05:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
} as unknown as AttemptSnapshot;

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-end-download") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

/** jsdom implements neither object URLs nor a real download. */
const stubDownloads = () => {
  const created: Blob[] = [];
  const clicked: Array<{ href: string; download: string }> = [];
  URL.createObjectURL = vi.fn((blob: Blob) => {
    created.push(blob);
    return `blob:${created.length}`;
  }) as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download });
    });
  return { created, clicked, click };
};

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<bitflow-end-download>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-end-download")).toBeDefined();
  });

  it("renders the closing message as markdown", async () => {
    const element = await mount({ attempt });
    expect(element.textContent).toContain("All done");
    expect(element.querySelector("strong")?.textContent).toBe("copy");
  });

  it("offers nothing to save when there is no attempt", async () => {
    // Which is what an author previewing the closing text is looking at.
    const element = await mount();
    expect(element.querySelectorAll("button")).toHaveLength(0);
    expect(element.textContent).toContain("nothing to save");
  });

  it("saves the attempt as a JSON file named by the author", async () => {
    const { created, clicked } = stubDownloads();
    const element = await mount({ attempt });

    element.querySelector("button")!.click();
    await flush();

    expect(clicked).toHaveLength(1);
    // Spaces cannot go into a file name unescaped, so they become dashes.
    expect(clicked[0].download).toBe("my-results.json");
    expect(created[0].type).toBe("application/json");
  });

  it("says what it saved, out loud", async () => {
    stubDownloads();
    const element = await mount({ attempt });

    element.querySelector("button")!.click();
    await flush();

    const status = element.querySelector('[role="status"]');
    expect(status?.textContent).toContain("my-results.json");
  });

  it("says so when the browser will not let it save", async () => {
    URL.createObjectURL = vi.fn(() => {
      throw new Error("no");
    }) as unknown as typeof URL.createObjectURL;
    const element = await mount({ attempt });

    element.querySelector("button")!.click();
    await flush();

    // This may be the only copy of their work, so a silent failure is the one
    // outcome that must not happen.
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "could not be saved",
    );
  });

  it("saves nothing while the run is only being reviewed", async () => {
    stubDownloads();
    const element = await mount({ attempt, readonly: true });
    expect((element.querySelector("button") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe("payloadOf", () => {
  it("carries the whole attempt when the author asked for it", () => {
    expect(payloadOf(attempt, true)).toEqual(attempt);
  });

  it("leaves the answers behind when they asked for that", () => {
    const payload = payloadOf(attempt, false);
    expect(payload.answers).toEqual({});
    expect(payload.results).toEqual(attempt.results);
  });

  it("leaves the written reasoning behind with them", () => {
    // An explanation in the learner's own words gives away at least as much as
    // the answer it explains.
    expect(payloadOf(attempt, false).reasoning).toBeUndefined();
  });

  it("keeps confidence, which is a number about a task", () => {
    expect(payloadOf(attempt, false).confidence).toEqual(attempt.confidence);
  });
});

describe("filenameOf", () => {
  it("adds the extension, once", () => {
    expect(filenameOf({ ...data, filename: "results" })).toBe("results.json");
    expect(filenameOf({ ...data, filename: "results.json" })).toBe("results.json");
  });

  it("replaces anything a file system would object to", () => {
    expect(filenameOf({ ...data, filename: "7b / term 1" })).toBe("7b-term-1.json");
  });

  it("falls back rather than producing a nameless file", () => {
    expect(filenameOf({ ...data, filename: "   " })).toBe("attempt.json");
    expect(filenameOf({ ...data, filename: "///" })).toBe("attempt.json");
  });
});
