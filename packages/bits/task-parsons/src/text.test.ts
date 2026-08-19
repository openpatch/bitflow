import { describe, expect, it } from "vitest";
import type { Line } from "./schema";
import { asLines, asText, indentUnit, linesFrom, sameLines } from "./text";

const line = (
  id: string,
  text: string,
  indent = 0,
  distractor = false,
): Line => ({ id, text, indent, distractor });

describe("indentUnit", () => {
  it("takes the narrowest indent that occurs", () => {
    expect(indentUnit("a\n  b\n    c")).toBe(2);
    expect(indentUnit("a\n    b\n        c")).toBe(4);
  });

  it("reads a tab as one step", () => {
    expect(indentUnit("a\n\tb\n\t\tc")).toBe(1);
  });

  it("falls back to one when nothing is indented", () => {
    expect(indentUnit("a\nb")).toBe(1);
  });

  it("ignores blank lines, which have no indent to speak of", () => {
    expect(indentUnit("a\n\n    b")).toBe(4);
  });
});

describe("asLines", () => {
  it("reads nesting off the code, whatever it is written in", () => {
    const two = asLines("def f():\n  if x:\n    return 1", [], false);
    const four = asLines("def f():\n    if x:\n        return 1", [], false);

    expect(two.map((l) => l.indent)).toEqual([0, 1, 2]);
    expect(four.map((l) => l.indent)).toEqual([0, 1, 2]);
  });

  it("drops blank lines, since a card with nothing on it is not a line", () => {
    expect(asLines("a\n\n\nb", [], false).map((l) => l.text)).toEqual(["a", "b"]);
  });

  it("keeps the id of a line whose code has not changed", () => {
    const existing = [line("keep", "print(x)"), line("other", "x = 1")];

    const next = asLines("x = 1\nprint(x)", existing, false);

    expect(next.map((l) => l.id)).toEqual(["other", "keep"]);
  });

  it("gives two identical lines two ids", () => {
    const next = asLines("x += 1\nx += 1", [line("a", "x += 1")], false);

    expect(next[0].id).toBe("a");
    expect(next[1].id).not.toBe("a");
  });

  it("does not indent a line that belongs nowhere", () => {
    // It is never placed in the program, so its nesting means nothing.
    expect(asLines("    stray()", [], true)[0].indent).toBe(0);
  });
});

describe("asText", () => {
  it("round-trips four-space code unchanged", () => {
    const code = "def f():\n    if x:\n        return 1\n    return 0";
    expect(asText(asLines(code, [], false))).toBe(code);
  });

  it("writes two-space code back out at one step per level", () => {
    // The schema stores steps, not spaces, so this is a normalisation and not
    // a loss: the nesting the author wrote is the nesting that comes back.
    expect(asText(asLines("a\n  b\n    c", [], false))).toBe(
      "a\n    b\n        c",
    );
  });
});

describe("linesFrom", () => {
  it("puts the program first and the strays after it", () => {
    const lines = linesFrom("a\n    b", "c", []);

    expect(lines.map((l) => [l.text, l.indent, l.distractor])).toEqual([
      ["a", 0, false],
      ["b", 1, false],
      ["c", 0, true],
    ]);
  });

  it("keeps a line's id when it moves over to the strays", () => {
    const existing = [line("moved", "print(x)")];

    const lines = linesFrom("", "print(x)", existing);

    expect(lines[0].id).toBe("moved");
    expect(lines[0].distractor).toBe(true);
  });

  it("never lets both boxes claim the same id", () => {
    const existing = [line("shared", "x = 1")];

    const lines = linesFrom("x = 1", "x = 1", existing);

    expect(lines[0].id).toBe("shared");
    expect(lines[1].id).not.toBe("shared");
  });
});

describe("sameLines", () => {
  it("ignores ids, which the author never sees", () => {
    expect(sameLines([line("a", "x")], [line("b", "x")])).toBe(true);
  });

  it("notices a changed indent", () => {
    expect(sameLines([line("a", "x", 0)], [line("a", "x", 1)])).toBe(false);
  });

  it("notices a line that moved to the strays", () => {
    expect(sameLines([line("a", "x", 0, false)], [line("a", "x", 0, true)])).toBe(
      false,
    );
  });
});
