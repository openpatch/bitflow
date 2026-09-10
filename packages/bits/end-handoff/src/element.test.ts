import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
import { isFollowableUrl, isSendableOrigin, MESSAGE_TYPE, type Data } from "./schema";
import type { AttemptSnapshot } from "@bitflow/core";

const data: Data = {
  title: "All done",
  markdown: "Your work is on its way **back**.",
  postMessage: true,
  messageOrigin: "https://school.example",
  continueUrl: "",
  continueLabel: "",
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
  elapsedMs: {},
  pools: {},
  startedAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:05:00.000Z",
  enteredAt: "2026-01-01T10:05:00.000Z",
  completedAt: "2026-01-01T10:05:00.000Z",
} as unknown as AttemptSnapshot;

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-end-handoff") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

/**
 * Stands a fake parent window in front of jsdom's.
 *
 * jsdom is never in a frame, so `window.parent` is the window itself — which
 * the bit reads as "nothing is hosting this page" and refuses to post to. A
 * stub is what puts a test in the embedded case this bit exists for.
 */
const framedBy = (postMessage = vi.fn()) => {
  vi.stubGlobal("parent", { postMessage });
  return postMessage;
};

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("<bitflow-end-handoff>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-end-handoff")).toBeDefined();
  });

  it("renders the closing message as markdown", async () => {
    const element = await mount({ attempt });
    expect(element.querySelector("strong")?.textContent).toBe("back");
  });

  it("posts the attempt to exactly the address the author gave", async () => {
    const post = framedBy();
    await mount({ attempt });

    expect(post).toHaveBeenCalledOnce();
    expect(post.mock.calls[0][0]).toEqual({ type: MESSAGE_TYPE, attempt });
    expect(post.mock.calls[0][1]).toBe("https://school.example");
  });

  it("says the work got out", async () => {
    framedBy();
    const element = await mount({ attempt });
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "has been sent",
    );
  });

  it("sends once, not once per redraw", async () => {
    const post = framedBy();
    const element = await mount({ attempt });
    // A property assignment is what a host does; it must not re-send.
    (element as unknown as Record<string, unknown>).locale = "de";
    await flush();
    expect(post).toHaveBeenCalledOnce();
  });

  it("sends nothing at all when the author left the address out", async () => {
    const post = framedBy();
    const element = await mount({
      data: { ...data, messageOrigin: "" },
      attempt,
    });

    expect(post).not.toHaveBeenCalled();
    // And says so, because this tab is now the only place the work exists.
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "not set up to send",
    );
  });

  it("refuses a wildcard address outright", async () => {
    const post = framedBy();
    await mount({ data: { ...data, messageOrigin: "*" }, attempt });
    expect(post).not.toHaveBeenCalled();
  });

  it("tells the learner when sending failed, and offers another go", async () => {
    const post = framedBy(
      vi.fn(() => {
        // Only something unserialisable gets here — a mismatched origin is
        // discarded in silence — but either way the learner has to be told.
        throw new DOMException("could not be cloned");
      }),
    );
    const element = await mount({ attempt });

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "could not be sent",
    );

    const retry = element.querySelector("button")!;
    expect(retry.textContent).toContain("Try sending again");

    post.mockImplementation(() => {});
    retry.click();
    await flush();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "has been sent",
    );
  });

  it("sends nothing while the run is only being reviewed", async () => {
    const post = framedBy();
    await mount({ attempt, readonly: true });
    expect(post).not.toHaveBeenCalled();
  });

  it("says so when nothing is framing the page, rather than claiming success", async () => {
    // No `framedBy`: jsdom's own window is its own parent, which is the
    // standalone case. Posting would deliver to this very page and report the
    // work sent, on the one screen where that lie costs the learner the work.
    const element = await mount({ attempt });
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "not inside anything to send to",
    );
  });

  it("refuses to draw a link that would run a script", async () => {
    framedBy();
    const element = await mount({
      // eslint-disable-next-line no-script-url
      data: { ...data, continueUrl: "javascript:alert(1)" },
      attempt,
    });
    expect(element.querySelector("a")).toBeNull();
  });

  it("offers the link the author gave, as a link", async () => {
    framedBy();
    const element = await mount({
      data: { ...data, continueUrl: "https://school.example/next" },
      attempt,
    });
    const link = element.querySelector("a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("https://school.example/next");
    expect(link.textContent).toBe("Continue");
  });
});

describe("isFollowableUrl", () => {
  it("accepts an ordinary web address, absolute or relative", () => {
    expect(isFollowableUrl("https://school.example/next")).toBe(true);
    expect(isFollowableUrl("http://localhost:5173/next")).toBe(true);
    expect(isFollowableUrl("/next")).toBe(true);
    expect(isFollowableUrl("  https://school.example  ")).toBe(true);
  });

  it("refuses a scheme that runs rather than navigates", () => {
    expect(isFollowableUrl("javascript:alert(1)")).toBe(false);
    expect(isFollowableUrl("  JavaScript:alert(1)")).toBe(false);
    expect(isFollowableUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("refuses an empty address, which is simply no link", () => {
    expect(isFollowableUrl("")).toBe(false);
    expect(isFollowableUrl("   ")).toBe(false);
  });
});

describe("isSendableOrigin", () => {
  it("accepts a bare origin", () => {
    expect(isSendableOrigin("https://school.example")).toBe(true);
    expect(isSendableOrigin("http://localhost:5173")).toBe(true);
    expect(isSendableOrigin("  https://school.example  ")).toBe(true);
  });

  it("refuses a wildcard, which would send to whoever framed the page", () => {
    expect(isSendableOrigin("*")).toBe(false);
  });

  it("refuses an empty address", () => {
    expect(isSendableOrigin("")).toBe(false);
    expect(isSendableOrigin("   ")).toBe(false);
  });

  it("refuses anything carrying a path, which is a typo", () => {
    expect(isSendableOrigin("https://school.example/lms")).toBe(false);
  });

  it("refuses a scheme that cannot receive a message", () => {
    expect(isSendableOrigin("javascript:alert(1)")).toBe(false);
    expect(isSendableOrigin("file:///tmp")).toBe(false);
    expect(isSendableOrigin("school.example")).toBe(false);
  });
});
