import { listBits, type BitFormProps } from "@bitflow/core";
import axe, { type Result } from "axe-core";
import { createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { steps } from "./a11yFixture";
import { bitLoaders, loadBits } from "./bitLoaders";
import "./index";

/**
 * axe over the teacher's half of the project.
 *
 * `a11y.test.ts` covers what a learner meets. Nothing covered what an author
 * meets: its editor check mounts the editor with nothing selected, so it only
 * ever sees the flow's own settings and no bit's `Form` was looked at at all.
 *
 * Its own file so MathLive, a lazy import with module-level state that does
 * not survive being mounted and unmounted repeatedly in one jsdom, is loaded
 * once here rather than a second time after the flow suite has had it.
 */

const RULES_NEEDING_LAYOUT = [
  "color-contrast",
  "target-size",
  "scrollable-region-focusable",
];

/** See the note in `a11y.test.ts`: MathLive's own markup is not ours to fix. */
const THIRD_PARTY = ["math-field"];

const flush = async (times = 6) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

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

const describeViolations = (violations: Result[]): string =>
  violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n` +
        violation.nodes.map((node) => `  ${node.html}`).join("\n"),
    )
    .join("\n");

/**
 * MathLive cannot be mounted under jsdom — `MathAnswer.test.tsx` says so at
 * length, and its `connectedCallback` throws from inside a custom-element
 * callback where nothing this project wrote can catch it.
 *
 * The shared test setup stubs `ResizeObserver` for React Flow's benefit, and
 * that stub is enough to convince `loadMathfield` to go ahead. Taking it away
 * here — nothing in this file measures anything — sends it down the fallback
 * it already has for environments that cannot host a field, and the rest of
 * the maths form is checked as it should be.
 */
// @ts-expect-error deliberately removing the stub the setup file installs
delete globalThis.ResizeObserver;

afterEach(() => document.body.replaceChildren());

describe("authoring accessibility", () => {
  /**
   * Each form is rendered twice: once with the data a fresh step is given, and
   * once with a worked example — an empty list renders no rows, and the rows
   * are where most of the labels are.
   */
  it("has no violations in any bit's authoring form", async () => {
    await loadBits(Object.keys(bitLoaders));

    for (const bit of listBits()) {
      const Form = bit.Form as ComponentType<BitFormProps> | undefined;
      expect(Form, `${bit.type} has no authoring form`).toBeDefined();

      // Merged over the defaults, which is exactly what the editor hands a
      // form: `parseFlow` does not check bit data, so a field a fixture (or a
      // file from an older version) leaves out has to be filled in somewhere,
      // and the inspector is where.
      const authored = steps.find((step) => step.type === bit.type)?.data;
      const cases = [
        bit.defaultData(),
        authored && { ...(bit.defaultData() as object), ...authored },
      ].filter(Boolean);

      // Both cases are mounted before either is taken down. MathLive nulls a
      // module-level reference on disconnect and throws from the next
      // `connectedCallback`, so mount-check-unmount-mount-check trips over it
      // in jsdom where a real browser would not.
      const mounted = cases.map((data) => {
        const host = document.createElement("div");
        host.className = "bitflow-root";
        document.body.append(host);
        const root = createRoot(host);
        root.render(
          createElement(Form as ComponentType<BitFormProps>, {
            data,
            locale: "en",
            onChange: () => {},
            errors: [],
          } as BitFormProps),
        );
        return { host, root };
      });
      await flush();

      for (const { host } of mounted) {
        const violations = await check(host);
        expect(
          describeViolations(violations),
          `${bit.type} authoring form`,
        ).toBe("");
      }

      for (const { host, root } of mounted) {
        root.unmount();
        host.remove();
      }
    }
  }, 60_000);

});
