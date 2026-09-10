import { fireEvent } from "@testing-library/dom";
import { describe, expect, it, afterEach } from "vitest";
import "./index";
import { identityOf, isFilledIn, type Data } from "./schema";

const data: Data = {
  title: "Before you start",
  markdown: "So your work can be **handed back**.",
  fields: [
    { id: "name", label: "First name", hint: "", required: true, kind: "text", options: [] },
    {
      id: "class",
      label: "Class",
      hint: "Ask if you are not sure.",
      required: false,
      kind: "select",
      options: ["7a", "7b"],
    },
  ],
};

const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
};

const mount = async (props: Record<string, unknown> = {}) => {
  const element = document.createElement("bitflow-start-identify") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { data, locale: "en", ...props });
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => document.body.replaceChildren());

describe("<bitflow-start-identify>", () => {
  it("is defined by importing the package", () => {
    expect(customElements.get("bitflow-start-identify")).toBeDefined();
  });

  it("asks each question with a label attached to its control", async () => {
    const element = await mount();
    const input = element.querySelector('input[type="text"]') as HTMLInputElement;
    const label = element.querySelector(`label[for="${input.id}"]`);
    expect(label?.textContent).toContain("First name");
  });

  it("says which answers are needed", async () => {
    const element = await mount();
    expect(element.textContent).toContain("First name (Needed)");
    // And does not say it of the ones that are not.
    expect(element.textContent).toContain("Class");
    expect(element.textContent).not.toContain("Class (Needed)");
  });

  it("offers a list where the author gave one, with a blank first", async () => {
    const element = await mount();
    const options = [...element.querySelectorAll("option")].map((o) => o.textContent);
    expect(options).toEqual(["Choose…", "7a", "7b"]);
  });

  it("shows the hint under the question it belongs to", async () => {
    const element = await mount();
    expect(element.textContent).toContain("Ask if you are not sure.");
  });

  it("never shows a field with no wording", async () => {
    const element = await mount({
      data: {
        ...data,
        fields: [{ ...data.fields[0], label: "" }],
      },
    });
    expect(element.querySelectorAll("input")).toHaveLength(0);
  });

  it("says why they cannot move on, and stops once they can", async () => {
    const element = await mount();
    expect(element.textContent).toContain("before you start");

    const input = element.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Robin" } });
    await flush();

    expect(element.textContent).not.toContain("Fill in everything");
  });

  it("keeps the reason's box even once it has nothing to say", async () => {
    // Otherwise filling in the last field collapses a line and the Next button
    // jumps up by exactly that much, as the learner is reaching for it.
    const element = await mount();
    const reason = () => element.querySelector(".bitflow-identify-required");
    expect(reason()).not.toBeNull();

    fireEvent.change(element.querySelector('input[type="text"]')!, {
      target: { value: "Robin" },
    });
    await flush();

    expect(reason()).not.toBeNull();
    expect(reason()?.textContent).toBe("");
  });

  it("reports what they entered, keyed by field", async () => {
    const element = await mount();
    const answers: unknown[] = [];
    element.addEventListener("bitflow-answerchange", (event) =>
      answers.push((event as CustomEvent).detail.answer),
    );

    const input = element.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Robin" } });
    await flush();

    expect(answers).toEqual([{ name: "Robin" }]);
  });

  it("accepts no input while it is being reviewed", async () => {
    const element = await mount({ readonly: true, answer: { name: "Robin" } });
    const controls = [
      ...element.querySelectorAll("input, select"),
    ] as HTMLInputElement[];
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.every((control) => control.disabled)).toBe(true);
  });
});

describe("isFilledIn", () => {
  it("is false while a required answer is missing", () => {
    expect(isFilledIn(data, undefined)).toBe(false);
    expect(isFilledIn(data, { name: "" })).toBe(false);
  });

  it("does not accept a space as an answer", () => {
    expect(isFilledIn(data, { name: "   " })).toBe(false);
  });

  it("is true once every required answer is there", () => {
    expect(isFilledIn(data, { name: "Robin" })).toBe(true);
  });

  it("never requires a field that is never shown", () => {
    // Otherwise a question with no wording is a dead end nobody can get past.
    const invisible: Data = {
      ...data,
      fields: [{ ...data.fields[0], label: "" }],
    };
    expect(isFilledIn(invisible, {})).toBe(true);
  });
});

describe("identityOf", () => {
  it("takes the first field that has an answer", () => {
    expect(identityOf(data, { name: "Robin", class: "7a" })).toBe("Robin");
    expect(identityOf(data, { name: "", class: "7a" })).toBe("7a");
  });

  it("has nothing to give when they answered nothing", () => {
    expect(identityOf(data, {})).toBeUndefined();
  });
});
