import axe, { type Result } from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { loadBits } from "./bitLoaders";
import "./index";
import { flow, steps } from "./a11yFixture";

/**
 * Automated accessibility checks over the real elements, with every bit
 * registered.
 *
 * They live here rather than in each bit package because this is the only
 * place the whole thing is assembled: a bit's markup is only accessible in
 * context — the label a task renders has to be unique on a page that also has
 * a progress bar, a countdown and a live region around it.
 *
 * jsdom has no layout, so the rules that need geometry — colour contrast,
 * target size, overlap — cannot run here and are disabled rather than passing
 * vacuously. What is left is the part that regresses silently: labels, roles,
 * names, heading order, ARIA that points at nothing.
 */

const RULES_NEEDING_LAYOUT = [
  "color-contrast",
  "target-size",
  "scrollable-region-focusable",
];

/**
 * MathLive's own markup, which is not ours to fix.
 *
 * An upgraded `<math-field>` is a `contenteditable` host with `tabindex=0`
 * around an unnamed `role="textbox"` keyboard sink, which axe reports as
 * `nested-interactive` and `aria-input-field-name`. Nothing in this repo can
 * restructure that — bitflow gives the element an `aria-label` and that is the
 * whole of the surface it has.
 *
 * Excluded by name rather than by turning the rules off, so the rules keep
 * running over everything else, and excluded *deliberately*: until this was
 * written the flow check passed the maths step only because MathLive is a lazy
 * import that had not finished arriving before axe ran, which is not the same
 * thing as being clean.
 */
const THIRD_PARTY = ["math-field"];

const check = async (element: Element): Promise<Result[]> => {
  const results = await axe.run(
    { include: [element as HTMLElement], exclude: THIRD_PARTY.map((s) => [s]) },
    {
      rules: Object.fromEntries(
        RULES_NEEDING_LAYOUT.map((id) => [id, { enabled: false }]),
      ),
      resultTypes: ["violations"],
    },
  );
  return results.violations;
};

/** Names the offending markup, since "1 violation" alone is not actionable. */
const describeViolations = (violations: Result[]): string =>
  violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n` +
        violation.nodes.map((node) => `  ${node.html}`).join("\n"),
    )
    .join("\n");

const expectAccessible = async (element: Element) => {
  const violations = await check(element);
  expect(describeViolations(violations)).toBe("");
};

const flush = async (times = 6) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

const waitFor = async (
  predicate: () => boolean,
  describe: () => string = () => "",
  attempts = 200,
) => {
  for (let i = 0; i < attempts; i++) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`timed out waiting for the element to settle. ${describe()}`);
};

const mountFlow = async () => {
  const element = document.createElement("bitflow-flow") as HTMLElement &
    Record<string, unknown>;
  Object.assign(element, { flow, locale: "en" });
  document.body.append(element);
  await flush();
  await waitFor(() => element.querySelectorAll("button").length > 0);
  return element;
};

const labelled = (element: Element, label: string) =>
  [...element.querySelectorAll("button")].find(
    (button) => button.textContent === label,
  );

afterEach(() => document.body.replaceChildren());

describe("accessibility", () => {
  it("checks the whole flow, one step at a time", async () => {
    const element = await mountFlow();
    const visited: string[] = [];

    // Every step, including the ones only reachable by answering, and both
    // states of a task — asked, and answered with feedback showing.
    for (let step = 0; step < steps.length; step++) {
      visited.push(steps[step].type);
      await expectAccessible(element);

      const check = labelled(element, "Check");
      if (check) {
        check.click();
        // Grading is async, and how long it takes is the bit's business —
        // waiting for the outcome beats guessing a number of ticks.
        await waitFor(
          () => labelled(element, "Check") === undefined,
          () => `${steps[step].type} never graded: ${element.textContent}`,
        );
        // Feedback, the confidence radios and the reasoning field all appear
        // only now, and all three are easy to leave unlabelled.
        await expectAccessible(element);
      }

      const next = labelled(element, "Next");
      // The end screen has no Next; anywhere else, a missing one means the
      // walk stalled and the steps after it were never checked.
      if (!next) {
        if (step === steps.length - 1) break;
        throw new Error(
          `stuck after ${steps[step].type}; buttons were ` +
            [...element.querySelectorAll("button")]
              .map((b) => `"${b.textContent}"`)
              .join(", "),
        );
      }
      next.click();
      await flush();
    }

    // Without this the test would still pass if the walk stopped at step one,
    // which is exactly how an accessibility suite quietly stops checking.
    expect(visited).toEqual(steps.map((step) => step.type));
  }, 30_000);

  it("checks a task mounted on its own", async () => {
    await loadBits(["task-choice"]);
    const element = document.createElement("bitflow-task-choice") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, {
      data: steps.find((step) => step.type === "task-choice")!.data,
      locale: "en",
    });
    document.body.append(element);
    await flush();
    await waitFor(() => element.querySelectorAll("input").length > 0);

    await expectAccessible(element);
  }, 15_000);

  it("checks the editor", async () => {
    const element = document.createElement("bitflow-flow-editor") as HTMLElement &
      Record<string, unknown>;
    Object.assign(element, { flow, locale: "en" });
    document.body.append(element);
    await flush();
    await waitFor(() => element.querySelectorAll("button").length > 0);

    await expectAccessible(element);
  }, 30_000);
});
