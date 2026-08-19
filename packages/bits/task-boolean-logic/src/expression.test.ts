import { describe, expect, it } from "vitest";
import { format, parse, valueOf, variablesIn } from "./expression";
import type { Expression } from "./schema";

const tree = (source: string): Expression => {
  const result = parse(source);
  if (!result.ok) throw new Error(`${source}: ${result.error}`);
  return result.value;
};

/** The expression as text, which is the readable way to assert on a tree. */
const shape = (source: string) => format(tree(source));

describe("parse", () => {
  it("reads a variable, a constant and a negation", () => {
    expect(tree("A")).toEqual({ kind: "variable", name: "A" });
    expect(tree("1")).toEqual({ kind: "constant", value: true });
    expect(tree("¬A")).toEqual({
      kind: "not",
      value: { kind: "variable", name: "A" },
    });
  });

  it("takes every spelling of a connective", () => {
    for (const source of ["A AND B", "A and B", "A && B", "A ∧ B", "A & B", "A * B"]) {
      expect(shape(source)).toBe("A ∧ B");
    }
    for (const source of ["A OR B", "A || B", "A ∨ B", "A + B"]) {
      expect(shape(source)).toBe("A ∨ B");
    }
    for (const source of ["A -> B", "A => B", "A → B", "A implies B"]) {
      expect(shape(source)).toBe("A → B");
    }
    for (const source of ["A <-> B", "A ↔ B", "A iff B"]) {
      expect(shape(source)).toBe("A ↔ B");
    }
    for (const source of ["A XOR B", "A ^ B", "A ⊕ B"]) {
      expect(shape(source)).toBe("A ⊕ B");
    }
    for (const source of ["!A", "~A", "NOT A", "¬A"]) {
      expect(shape(source)).toBe("¬A");
    }
  });

  /** The textbook order, so an expression copied out of one means the same. */
  it("binds not tightest and iff loosest", () => {
    expect(shape("¬A ∧ B")).toBe("¬A ∧ B");
    expect(shape("A ∧ B ∨ C")).toBe("A ∧ B ∨ C");
    expect(shape("A ∨ B ∧ C")).toBe("A ∨ B ∧ C");
    expect(tree("A ∨ B ∧ C").kind).toBe("or");
    expect(tree("A ∧ B ∨ C").kind).toBe("or");
    expect(tree("A -> B <-> C").kind).toBe("iff");
  });

  it("keeps the brackets that change the meaning", () => {
    expect(shape("(A ∨ B) ∧ C")).toBe("(A ∨ B) ∧ C");
    expect(tree("(A ∨ B) ∧ C").kind).toBe("and");
    expect(shape("¬(A ∧ B)")).toBe("¬(A ∧ B)");
  });

  it("drops the brackets that change nothing", () => {
    expect(shape("((A))")).toBe("A");
    expect(shape("(A ∧ B) ∧ C")).toBe("A ∧ B ∧ C");
  });

  /** `a -> b -> c` is `a -> (b -> c)`, as implication conventionally is. */
  it("associates implication to the right", () => {
    expect(shape("A -> B -> C")).toBe("A → (B → C)");
  });

  it("says what is wrong rather than throwing", () => {
    expect(parse("A ∧")).toEqual({ ok: false, error: expect.any(String) });
    expect(parse("(A")).toMatchObject({ ok: false });
    expect(parse("A)")).toMatchObject({ ok: false });
    expect(parse("∧ A")).toMatchObject({ ok: false });
    expect(parse("")).toMatchObject({ ok: false });
    expect(parse("A B")).toMatchObject({ ok: false });
  });

  /**
   * The grammar has no way to *name* a global, a property or a call target, so
   * none of this is blocked — it cannot be written down. There is no `eval`,
   * no `Function` and no `RegExp` built from this text anywhere.
   */
  it("cannot express a call, a property or a global", () => {
    expect(parse("alert(1)")).toMatchObject({ ok: false });
    expect(parse("window.location")).toMatchObject({ ok: false });
    expect(parse("constructor")).toMatchObject({
      ok: true,
      // Only ever a variable name.
      value: { kind: "variable", name: "constructor" },
    });
    expect(parse("A; B")).toMatchObject({ ok: false });
  });

  it("reads a variable with digits, an underscore or an accent", () => {
    expect(variablesIn(tree("A1 ∧ x_2 ∧ größer"))).toEqual(["A1", "x_2", "größer"]);
  });
});

describe("format", () => {
  it("round-trips whatever it printed", () => {
    for (const source of [
      "A",
      "¬A",
      "A ∧ B",
      "A ∨ B ∧ C",
      "(A ∨ B) ∧ ¬C",
      "A → (B → C)",
      "A ↔ B ⊕ C",
      "¬(A ∨ B) ∧ (C ↔ 1)",
    ]) {
      expect(format(tree(format(tree(source))))).toBe(format(tree(source)));
    }
  });
});

describe("variablesIn", () => {
  it("lists each name once, in the order it is first mentioned", () => {
    expect(variablesIn(tree("B ∧ (A ∨ B)"))).toEqual(["B", "A"]);
  });

  it("finds none in a constant", () => {
    expect(variablesIn(tree("1 ∧ 0"))).toEqual([]);
  });
});

describe("valueOf", () => {
  const table = (source: string, names: string[]) => {
    const expression = tree(source);
    return Array.from({ length: 2 ** names.length }, (_unused, index) => {
      const inputs = Object.fromEntries(
        names.map((name, position) => [
          name,
          (index >> (names.length - 1 - position)) % 2 === 1,
        ]),
      );
      return valueOf(expression, inputs) ? 1 : 0;
    });
  };

  it("works out each connective's truth table", () => {
    expect(table("A ∧ B", ["A", "B"])).toEqual([0, 0, 0, 1]);
    expect(table("A ∨ B", ["A", "B"])).toEqual([0, 1, 1, 1]);
    expect(table("A ⊕ B", ["A", "B"])).toEqual([0, 1, 1, 0]);
    expect(table("A → B", ["A", "B"])).toEqual([1, 1, 0, 1]);
    expect(table("A ↔ B", ["A", "B"])).toEqual([1, 0, 0, 1]);
    expect(table("¬A", ["A"])).toEqual([1, 0]);
  });

  it("works out the expression the spec asks for", () => {
    // A AND NOT B.
    expect(table("A ∧ ¬B", ["A", "B"])).toEqual([0, 0, 1, 0]);
  });

  it("proves De Morgan over every row", () => {
    expect(table("¬(A ∧ B)", ["A", "B"])).toEqual(table("¬A ∨ ¬B", ["A", "B"]));
    expect(table("¬(A ∨ B)", ["A", "B"])).toEqual(table("¬A ∧ ¬B", ["A", "B"]));
  });

  /**
   * Only reachable from a hand-edited file — the rows are generated from the
   * declared variables — and a wrong answer beats a flow that stops.
   */
  it("reads a variable nothing assigned as false", () => {
    expect(valueOf(tree("A"), {})).toBe(false);
  });
});
