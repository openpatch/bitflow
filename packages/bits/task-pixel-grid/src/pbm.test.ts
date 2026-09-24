import { describe, expect, it } from "vitest";
import { PbmError, parsePbm } from "./pbm";

const failure = (text: string) => {
  try {
    parsePbm(text);
  } catch (error) {
    return error as PbmError;
  }
  throw new Error("expected the listing to be refused");
};

describe("parsePbm", () => {
  it("reads a listing into white and black cells", () => {
    const parsed = parsePbm("P1\n3 2\n0 1 0\n1 0 1\n");
    expect(parsed).toEqual({
      rows: 2,
      columns: 3,
      cells: [
        ["white", "black", "white"],
        ["black", "white", "black"],
      ],
    });
  });

  it("skips comments and reads pixels that run together", () => {
    const parsed = parsePbm("P1\n# a house\n3 1 # width height\n010");
    expect(parsed.cells).toEqual([["white", "black", "white"]]);
  });

  it("says which problem it found, for the form to put into words", () => {
    expect(failure("P2\n1 1\n0").key).toBe("pbmNoMagic");
    expect(failure("P1\n0 3\n").key).toBe("pbmBadSize");
    expect(failure("P1\n2 2\n0 1 0").vars).toEqual({
      expected: 4,
      rows: 2,
      columns: 2,
      found: 3,
    });
    expect(failure("P1\n2 1\n0 2").key).toBe("pbmBadValue");
  });
});
