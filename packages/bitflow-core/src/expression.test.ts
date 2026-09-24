import { describe, expect, it } from "vitest";
import { parseExpression } from "./expression";

const at = (source: string, x: number) => {
  const result = parseExpression(source, { variables: { x } });
  return result.ok ? result.value : result.error;
};

describe("parseExpression with variables", () => {
  it("evaluates a function of x", () => {
    expect(at("x^2 - 3*x + 1", 2)).toBe(-1);
    expect(at("sin(x)", 0)).toBe(0);
  });

  it("multiplies by juxtaposition only when variables are given", () => {
    expect(at("3x", 2)).toBe(6);
    expect(at("2(x + 1)", 1)).toBe(4);
    expect(at("2x^2", 3)).toBe(18);
    expect(at("-x^2", 3)).toBe(-9);
    const plain = parseExpression("2pi");
    expect(plain.ok && plain.rest === "").toBe(false);
  });

  it("reads a variable before a constant of the same name", () => {
    const result = parseExpression("e + 1", { variables: { e: 1 } });
    expect(result.ok && result.value).toBe(2);
  });

  it("still refuses a name nobody gave a value", () => {
    const result = parseExpression("x + y", { variables: { x: 1 } });
    expect(result.ok && result.rest).not.toBe("");
  });
});
