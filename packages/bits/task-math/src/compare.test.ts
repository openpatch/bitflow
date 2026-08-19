// @vitest-environment node
//
// The comparison is algebra over strings — no DOM anywhere in it — and running
// it in Node is the proof: a grader that needed a browser could not be checked
// by a report tool or replayed from a snapshot.
import { describe, expect, it } from "vitest";
import { matchesAny, sameMath } from "./compare";

const same = (a: string, b: string, mode: "symbolic" | "equivalent" | "value" = "symbolic") =>
  sameMath(a, b, { mode });

describe("symbolic", () => {
  it("does not care how the same expression is written", async () => {
    expect(await same("2x", "2\\cdot x")).toBe(true);
    expect(await same("2x", "x\\cdot 2")).toBe(true);
    expect(await same("x+1", "1+x")).toBe(true);
    expect(await same("\\frac{2}{4}", "\\frac{1}{2}")).toBe(true);
  });

  it("keeps a different expression different", async () => {
    expect(await same("2x", "x^2")).toBe(false);
    expect(await same("x+1", "x-1")).toBe(false);
  });

  it("holds a factorised answer apart from an expanded one", async () => {
    // The whole reason "factorise it" is a question. Accepting the expanded
    // form here would accept the question back as its own answer.
    expect(await same("(2x-1)(x+1)", "2x^2+x-1")).toBe(false);
  });
});

describe("equivalent", () => {
  it("accepts anything mathematically equal", async () => {
    expect(await same("(2x-1)(x+1)", "2x^2+x-1", "equivalent")).toBe(true);
    expect(await same("x+x", "2x", "equivalent")).toBe(true);
    expect(await same("\\sin^2(x)+\\cos^2(x)", "1", "equivalent")).toBe(true);
  });

  it("still refuses what is not equal", async () => {
    expect(await same("x^2", "x^3", "equivalent")).toBe(false);
  });
});

describe("value", () => {
  it("compares what the expressions come to", async () => {
    expect(await same("\\frac{1}{2}", "0.5", "value")).toBe(true);
    expect(await same("2^{10}", "1024", "value")).toBe(true);
    expect(await same("\\sqrt{16}", "4", "value")).toBe(true);
  });

  it("has nothing to compare when something is unknown", async () => {
    expect(await same("x+1", "1+x", "value")).toBe(false);
  });

  it("accepts a tolerance", async () => {
    expect(await sameMath("3.14", "\\pi", { mode: "value", tolerance: 0.01 })).toBe(true);
    expect(await sameMath("3.14", "\\pi", { mode: "value", tolerance: 0.0001 })).toBe(false);
  });

  it("forgives floating-point noise with no tolerance set", async () => {
    expect(await same("0.1+0.2", "0.3", "value")).toBe(true);
  });
});

describe("what will not parse", () => {
  it("is not the same as anything, including itself", async () => {
    // Two unreadable answers agreeing with each other would mark gibberish
    // correct against a broken expected value.
    expect(await same("\\frac{1}{", "\\frac{1}{")).toBe(false);
    expect(await same("", "x")).toBe(false);
    expect(await same("x", "")).toBe(false);
  });
});

describe("matchesAny", () => {
  it("takes the first of the author's accepted answers that matches", async () => {
    expect(await matchesAny("0.5", ["\\frac{1}{2}", "0.5"], { mode: "symbolic" })).toBe(true);
    expect(await matchesAny("0.25", ["\\frac{1}{2}", "0.5"], { mode: "symbolic" })).toBe(false);
    expect(await matchesAny("x", [], { mode: "symbolic" })).toBe(false);
  });
});
