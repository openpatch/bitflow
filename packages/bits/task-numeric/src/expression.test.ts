import { describe, expect, it } from "vitest";
import {
  canonicalUnit,
  MAX_LENGTH,
  parseExpression,
  parseQuantity,
} from "./expression";

/** The value, or the failure, without the ceremony. */
const value = (source: string, options = {}) => {
  const result = parseExpression(source, options);
  return result.ok ? result.value : result.error;
};

describe("parseExpression", () => {
  it("reads plain numbers", () => {
    expect(value("12")).toBe(12);
    expect(value("0.75")).toBe(0.75);
    expect(value(".5")).toBe(0.5);
    expect(value("-3")).toBe(-3);
    expect(value("+3")).toBe(3);
    expect(value("1.5e3")).toBe(1500);
    expect(value("1.5E-3")).toBe(0.0015);
  });

  it("applies the usual precedence and associativity", () => {
    expect(value("2 + 3 * 4")).toBe(14);
    expect(value("(2 + 3) * 4")).toBe(20);
    expect(value("10 - 4 - 3")).toBe(3);
    expect(value("100 / 10 / 2")).toBe(5);
    // Right-associative, the way it is written on paper.
    expect(value("2^3^2")).toBe(512);
    expect(value("-2^2")).toBe(-4);
  });

  it("knows the functions and constants it lists, and nothing else", () => {
    expect(value("sqrt(16)")).toBe(4);
    expect(value("max(1, 5, 3)")).toBe(5);
    expect(value("round(2.7)")).toBe(3);
    expect(value("log(1000)")).toBeCloseTo(3);
    expect(value("ln(1)")).toBe(0);
    expect(value("pi")).toBeCloseTo(Math.PI);
    expect(value("2*pi")).toBeCloseTo(Math.PI * 2);

    // Anything not on the list is not arithmetic, so the expression simply
    // ends there and the caller gets it back as a unit.
    expect(parseQuantity("alert(1)")).toEqual({ ok: false, error: "syntax" });
  });

  it("cannot reach anything outside arithmetic", () => {
    // The grammar has no way to name a global, a property or a call target,
    // so these are not "blocked" so much as unsayable.
    for (const source of [
      "constructor",
      "globalThis",
      "window.alert(1)",
      "[].constructor",
      "process.exit(1)",
      "this",
      "1;alert(1)",
    ]) {
      const result = parseExpression(source);
      expect(result.ok, source).toBe(false);
    }
  });

  it("refuses what does not come out to a number", () => {
    expect(value("1/0")).toBe("notFinite");
    expect(value("0/0")).toBe("notFinite");
    expect(value("sqrt(-1)")).toBe("notFinite");
  });

  it("refuses malformed arithmetic rather than guessing", () => {
    expect(value("2 +")).toBe("syntax");
    expect(value("(2 + 3")).toBe("syntax");
    expect(value("2 + ) 3")).toBe("syntax");
    expect(value("1.2.3")).toBe("syntax");
    expect(value("sqrt")).toBe("syntax");
    expect(value("sqrt(1, 2)")).toBe("arity");
    expect(value("")).toBe("empty");
    expect(value("   ")).toBe("empty");
    expect(value("1".repeat(MAX_LENGTH + 1))).toBe("tooLong");
  });

  it("takes a comma as a decimal point when told to", () => {
    expect(value("0,75", { decimalSeparator: "both" })).toBe(0.75);
    expect(value("0,75", { decimalSeparator: "comma" })).toBe(0.75);
    // A comma is punctuation here, and `0,75` is not one expression.
    expect(value("0,75", { decimalSeparator: "point" })).toBe("syntax");
    expect(value("0.75", { decimalSeparator: "comma" })).toBe("syntax");
  });

  it("separates a function's arguments with a semicolon when the comma is spoken for", () => {
    expect(value("max(1;5)", { decimalSeparator: "comma" })).toBe(5);
  });

  it("accepts the signs that arrive by copy and paste", () => {
    expect(value("6 × 7")).toBe(42);
    expect(value("6 · 7")).toBe(42);
    expect(value("84 ÷ 2")).toBe(42);
    expect(value("−3")).toBe(-3);
    expect(value("2 ** 10")).toBe(1024);
  });

  it("refuses arithmetic when the author asked for a number", () => {
    const plain = { allowExpression: false };
    expect(value("0.75", plain)).toBe(0.75);
    expect(value("-0.75", plain)).toBe(-0.75);
    expect(value("1.5e3", plain)).toBe(1500);
    expect(value("3/4", plain)).toBe("expressionNotAllowed");
    expect(value("sqrt(4)", plain)).toBe("expressionNotAllowed");
  });
});

describe("parseQuantity", () => {
  it("hands back whatever followed the number as the unit", () => {
    expect(parseQuantity("9.81 m/s^2")).toEqual({
      ok: true,
      value: 9.81,
      unit: "m/s^2",
    });
    expect(parseQuantity("5kg")).toEqual({ ok: true, value: 5, unit: "kg" });
    expect(parseQuantity("42")).toEqual({ ok: true, value: 42, unit: "" });
  });

  it("works the arithmetic out before the unit begins", () => {
    expect(parseQuantity("1/2 m")).toEqual({ ok: true, value: 0.5, unit: "m" });
  });

  it("treats a function name as a unit when no call follows it", () => {
    // `min` is a function *and* a unit. Without the rule that a function name
    // needs its bracket, five minutes would be a syntax error.
    expect(parseQuantity("5 min")).toEqual({ ok: true, value: 5, unit: "min" });
    expect(parseQuantity("min(5, 9)")).toEqual({ ok: true, value: 5, unit: "" });
  });
});

describe("canonicalUnit", () => {
  it("folds away notation but never case", () => {
    expect(canonicalUnit("m/s²")).toBe("m/s^2");
    expect(canonicalUnit("m/s**2")).toBe("m/s^2");
    expect(canonicalUnit("N m")).toBe("Nm");
    expect(canonicalUnit("N·m")).toBe("Nm");
    expect(canonicalUnit(" kg ")).toBe("kg");
    expect(canonicalUnit("cm⁻¹")).toBe("cm^-1");

    // mm and Mm differ by a factor of a billion; folding case here would be
    // teaching that units are decoration.
    expect(canonicalUnit("mm")).not.toBe(canonicalUnit("Mm"));
  });

  it("settles the pairs of look-alike code points", () => {
    expect(canonicalUnit("µs")).toBe(canonicalUnit("μs"));
    expect(canonicalUnit("Ω")).toBe(canonicalUnit("Ω"));
  });
});
