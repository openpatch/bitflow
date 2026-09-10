import { describe, expect, it, afterEach } from "vitest";
import "./index";
import { isDecided, type Data } from "./schema";

const data: Data = {
  title: "Before you start",
  markdown: "This assessment records **your answers** and how long you took.",
  agreeLabel: "",
  requiredHint: "",
  allowDecline: true,
  declineLabel: "",
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-start-consent") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-start-consent>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-start-consent")).toBeDefined();
  });

  it("says what is recorded, as markdown", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Before you start");
    expect(element.querySelector("strong")?.textContent).toBe("your answers");
  });

  it("offers both answers when declining is allowed", async () => {
    const element = await mount();
    const radios = [...element.querySelectorAll('input[type="radio"]')];
    expect(radios).toHaveLength(2);
    expect(element.textContent).toContain("I agree to take part.");
    expect(element.textContent).toContain("I would rather not take part.");
  });

  it("offers a single tick box when it does not", async () => {
    const element = await mount({ data: { ...data, allowDecline: false } });
    expect(element.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    expect(element.querySelectorAll('input[type="checkbox"]')).toHaveLength(1);
    expect(element.textContent).not.toContain("I would rather not take part.");
  });

  it("uses the author's wording when they gave any", async () => {
    const element = await mount({
      data: { ...data, agreeLabel: "Yes, count me in", declineLabel: "No thanks" },
    });
    expect(element.textContent).toContain("Yes, count me in");
    expect(element.textContent).toContain("No thanks");
  });

  it("says why they cannot move on yet, and stops saying it once they have", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Choose one before you start.");

    (element.querySelector('input[type="radio"]') as HTMLInputElement).click();
    await flush();

    expect(element.textContent).not.toContain("Choose one before you start.");
  });

  it("keeps the reason's box even once it has nothing to say", async () => {
    // Otherwise choosing an answer collapses a line and the Next button jumps
    // up by exactly that much, at the moment the learner is reaching for it.
    const element = await mount();
    const reason = () => element.querySelector(".bitflow-consent-required");
    expect(reason()).not.toBeNull();

    (element.querySelector('input[type="radio"]') as HTMLInputElement).click();
    await flush();

    expect(reason()).not.toBeNull();
    expect(reason()?.textContent).toBe("");
  });

  it("reports the choice as an answer", async () => {
    const element = await mount();
    const answers: unknown[] = [];
    element.addEventListener("bitflow-answerchange", (event) =>
      answers.push((event as CustomEvent).detail.answer),
    );

    const [agree, decline] = [
      ...element.querySelectorAll('input[type="radio"]'),
    ] as HTMLInputElement[];
    agree.click();
    decline.click();
    await flush();

    expect(answers).toEqual([true, false]);
  });

  it("accepts no input while it is being reviewed", async () => {
    const element = await mount({ readonly: true, answer: true });
    const radios = [...element.querySelectorAll("input")] as HTMLInputElement[];
    expect(radios.every((radio) => radio.disabled)).toBe(true);
  });
});

describe("isDecided", () => {
  it("is false until they have said either way", () => {
    expect(isDecided(data, undefined)).toBe(false);
  });

  it("counts declining as a decision when declining is allowed", () => {
    // Which is what lets a connection send them somewhere else instead of
    // trapping them on the consent screen.
    expect(isDecided(data, false)).toBe(true);
    expect(isDecided(data, true)).toBe(true);
  });

  it("counts only agreement when it is not", () => {
    const forced = { ...data, allowDecline: false };
    expect(isDecided(forced, false)).toBe(false);
    expect(isDecided(forced, true)).toBe(true);
  });
});
