import { describe, expect, it } from "vitest";
import { describeFormulaError, evaluateFormulaAt, formulaFn } from "./formula";

describe("evaluateFormulaAt", () => {
  it("evaluates arithmetic at the given x", () => {
    expect(evaluateFormulaAt("0.5x^2 - 2", 4)).toEqual({ ok: true, value: 6 });
  });

  it("reads implicit multiplication once x is the variable", () => {
    expect(evaluateFormulaAt("2(x + 1)", 3)).toEqual({ ok: true, value: 8 });
  });

  it("fails on a syntax error", () => {
    expect(evaluateFormulaAt("x +", 1)).toEqual({ ok: false, error: "syntax" });
  });

  it("fails on an unknown name", () => {
    expect(evaluateFormulaAt("cot(x)", 1).ok).toBe(false);
  });

  it("fails when text is left over after the arithmetic", () => {
    // A unit-like suffix is fine on a plain quantity but not on a function.
    expect(evaluateFormulaAt("2x kg", 1)).toEqual({ ok: false, error: "trailing" });
  });

  it("fails when the result is not finite", () => {
    expect(evaluateFormulaAt("1/x", 0)).toEqual({ ok: false, error: "notFinite" });
  });

  it("fails on an empty formula", () => {
    expect(evaluateFormulaAt("", 1)).toEqual({ ok: false, error: "empty" });
  });
});

describe("formulaFn", () => {
  it("returns a callable function", () => {
    const f = formulaFn("x^2");
    expect(f(3)).toBe(9);
  });

  it("returns NaN instead of throwing for a bad formula", () => {
    const f = formulaFn("not arithmetic +");
    expect(Number.isNaN(f(1))).toBe(true);
  });

  it("returns NaN instead of throwing at a domain error", () => {
    const f = formulaFn("sqrt(x)");
    expect(Number.isNaN(f(-1))).toBe(true);
  });
});

describe("describeFormulaError", () => {
  it("has a message for every failure kind", () => {
    const errors = [
      "empty",
      "tooLong",
      "syntax",
      "unknownName",
      "arity",
      "expressionNotAllowed",
      "notFinite",
      "trailing",
    ] as const;
    for (const error of errors) {
      expect(describeFormulaError(error)).toEqual(expect.any(String));
      expect(describeFormulaError(error).length).toBeGreaterThan(0);
    }
  });
});
