import { describe, expect, it } from "vitest";
import {
  digitsNeeded,
  fits,
  rangeOf,
  read,
  write,
  type ParseOptions,
} from "./numbers";

const options = (over: Partial<ParseOptions> = {}): ParseOptions => ({
  bitWidth: 8,
  signed: false,
  allowPrefix: true,
  allowSeparators: true,
  requireFullWidth: false,
  ...over,
});

const values = (
  written: string,
  representation: Parameters<typeof read>[1],
  over: Partial<ParseOptions> = {},
) => {
  const reading = read(written, representation, options(over));
  return reading.ok ? reading.values.map(String) : reading.reason;
};

describe("digitsNeeded", () => {
  it("is the digits it takes to write every pattern of that width", () => {
    expect(digitsNeeded(8, "binary")).toBe(8);
    expect(digitsNeeded(8, "hex")).toBe(2);
    expect(digitsNeeded(8, "octal")).toBe(3);
    expect(digitsNeeded(8, "decimal")).toBe(0);
    expect(digitsNeeded(0, "binary")).toBe(0);
  });
});

describe("rangeOf", () => {
  it("is what the width can hold", () => {
    expect(rangeOf(8, false)).toEqual({ low: 0n, high: 255n });
    expect(rangeOf(8, true)).toEqual({ low: -128n, high: 127n });
    expect(rangeOf(0, false)).toBeUndefined();
  });

  it("has no bound without a width", () => {
    expect(fits(10n ** 30n, 0, true)).toBe(true);
  });
});

describe("read", () => {
  it("reads digits of the base it was told", () => {
    expect(values("101010", "binary")).toEqual(["42"]);
    expect(values("2a", "hex")).toEqual(["42"]);
    expect(values("52", "octal")).toEqual(["42"]);
    expect(values("42", "decimal")).toEqual(["42"]);
  });

  it("does not care about the case of a hex digit", () => {
    expect(values("2A", "hex")).toEqual(["42"]);
  });

  it("refuses a digit the base does not have", () => {
    expect(values("102", "binary")).toBe("badDigit");
    expect(values("2g", "hex")).toBe("badDigit");
    expect(values("18", "octal")).toBe("badDigit");
  });

  it("refuses trailing rubbish rather than reading past it", () => {
    // `parseInt("12nonsense")` is twelve, which is exactly the sort of quiet
    // wrong answer this grammar exists to avoid.
    expect(values("12nonsense", "decimal")).toBe("badDigit");
  });

  it("takes a prefix only when the author allows one", () => {
    expect(values("0b101010", "binary")).toEqual(["42"]);
    expect(values("0x2a", "hex")).toEqual(["42"]);
    expect(values("0b101010", "binary", { allowPrefix: false })).toBe("badDigit");
  });

  it("reads a fixed-width pattern as two's complement", () => {
    expect(values("11010110", "binary", { signed: true })).toEqual(["-42"]);
    expect(values("11010110", "binary")).toEqual(["214"]);
    expect(values("d6", "hex", { signed: true })).toEqual(["-42"]);
  });

  it("refuses a minus sign where the sign is the top bit", () => {
    // Writing −101010 for an eight-bit pattern is the mistake the question is
    // usually about, so it is refused rather than quietly understood.
    expect(values("-101010", "binary", { signed: true })).toBe("negative");
    expect(values("-42", "decimal", { signed: true })).toEqual(["-42"]);
    expect(values("-101010", "binary", { signed: true, bitWidth: 0 })).toEqual(["-42"]);
  });

  it("refuses a negative where nothing is signed", () => {
    expect(values("-42", "decimal")).toBe("negative");
  });

  it("refuses a value the width cannot hold", () => {
    expect(values("100000000", "binary")).toBe("tooWide");
    expect(values("256", "decimal")).toBe("tooWide");
    expect(values("128", "decimal", { signed: true })).toBe("tooWide");
    expect(values("127", "decimal", { signed: true })).toEqual(["127"]);
  });

  it("asks for the leading zeros only when the author does", () => {
    expect(values("101010", "binary", { requireFullWidth: true })).toBe("notFullWidth");
    expect(values("00101010", "binary", { requireFullWidth: true })).toEqual(["42"]);
    expect(values("101010", "binary")).toEqual(["42"]);
  });

  it("reads several groups when separators are allowed", () => {
    expect(values("01001000 01001001", "binary")).toEqual(["72", "73"]);
    // A space separates values; an underscore only groups digits.
    expect(values("0100_1000", "binary")).toEqual(["72"]);
    expect(values("01001000 01001001", "binary", { allowSeparators: false })).toBe(
      "badDigit",
    );
  });

  it("reads text one character at a time", () => {
    expect(values("HI", "text")).toEqual(["72", "73"]);
    // A space is a character with a code of its own.
    expect(values(" ", "text")).toEqual(["32"]);
  });

  it("refuses a character the width cannot hold", () => {
    expect(values("€", "text")).toBe("tooWide");
    expect(values("€", "text", { bitWidth: 16 })).toEqual(["8364"]);
    // Latin-1 still fits in a byte, which is the point of asking about width.
    expect(values("é", "text")).toEqual(["233"]);
  });

  it("says when there is nothing there", () => {
    expect(values("", "binary")).toBe("empty");
    expect(values("   ", "binary")).toBe("empty");
    expect(values("0b", "binary")).toBe("empty");
  });

  it("reads a width no double could hold exactly", () => {
    // 2⁵³ + 1, which is where `Number` stops counting one at a time.
    expect(values("9007199254740993", "decimal", { bitWidth: 64 })).toEqual([
      "9007199254740993",
    ]);
  });
});

describe("write", () => {
  it("writes the digits of the base, padded to the width", () => {
    expect(write([42n], "binary", options())).toBe("00101010");
    expect(write([42n], "hex", options())).toBe("2a");
    expect(write([42n], "octal", options())).toBe("052");
    expect(write([42n], "decimal", options())).toBe("42");
  });

  it("writes a negative as the pattern it is held as", () => {
    expect(write([-42n], "binary", options({ signed: true }))).toBe("11010110");
    expect(write([-42n], "decimal", options({ signed: true }))).toBe("-42");
  });

  it("does not pad what has no width", () => {
    expect(write([42n], "binary", options({ bitWidth: 0 }))).toBe("101010");
  });

  it("writes several values as groups", () => {
    expect(write([72n, 73n], "binary", options())).toBe("01001000 01001001");
    expect(write([72n, 73n], "text", options())).toBe("HI");
  });

  it("reads back what it writes", () => {
    for (const value of [0n, 1n, 42n, -1n, -128n, 127n]) {
      const written = write([value], "binary", options({ signed: true }));
      const back = read(written, "binary", options({ signed: true }));
      expect(back.ok && back.values).toEqual([value]);
    }
  });
});
