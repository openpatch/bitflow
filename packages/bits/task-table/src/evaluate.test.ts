import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { assignMinCost, cellCorrect, evaluate, matchRows, normalise } from "./evaluate";
import { cellKey, DataSchema, type Data } from "./schema";

const options = { caseSensitive: false, ignoreWhitespace: true, numberTolerance: 0 };

describe("normalise and cellCorrect", () => {
  it("reads a copied formula the way a spreadsheet would, keeping $", () => {
    expect(normalise("=d7 * (1-$h$2) + $H6", "formula", options)).toBe("=D7*(1-$H$2)+$H6");
    expect(cellCorrect(["=D7*(1-$H$2)+$H6"], "=d7*(1-$h$2)+$h6", "formula", options)).toBe(true);
    expect(cellCorrect(["=D7*(1-$H$2)+$H6"], "=D7*(1-H2)+$H6", "formula", options)).toBe(false);
  });

  it("takes a comma or a point as the decimal separator, within the tolerance", () => {
    expect(cellCorrect(["3.14"], "3,14", "number", options)).toBe(true);
    expect(cellCorrect(["3.14"], "3.1416", "number", options)).toBe(false);
    expect(
      cellCorrect(["3.14"], "3.1416", "number", { ...options, numberTolerance: 0.01 }),
    ).toBe(true);
    expect(cellCorrect(["-2"], "-2.0", "number", options)).toBe(true);
  });

  it("collapses spaces and ignores case unless asked not to", () => {
    expect(cellCorrect(["New York"], "  new   york ", "text", options)).toBe(true);
    expect(
      cellCorrect(["New York"], "new york", "text", { ...options, caseSensitive: true }),
    ).toBe(false);
  });

  it("accepts any of several spellings", () => {
    expect(cellCorrect(["Köln", "Koeln"], "koeln", "text", options)).toBe(true);
  });
});

describe("assignMinCost", () => {
  it("finds the cheapest assignment where the greedy choice would not", () => {
    // Greedy gives row 0 its cheapest column (0, cost 1) and leaves row 1 with
    // column 1 at cost 100 — 101 in all. Swapping costs 2 + 3 = 5.
    expect(
      assignMinCost([
        [1, 2],
        [3, 100],
      ]),
    ).toEqual([1, 0]);
  });
});

/** A query result: name and city, three rows, all blank, any order. */
const query = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    columns: [
      { id: "name", header: "name", kind: "text" },
      { id: "city", header: "city", kind: "text" },
    ],
    rows: [
      { id: "r1", cells: { name: { accepted: ["Ada"] }, city: { accepted: ["London"] } } },
      { id: "r2", cells: { name: { accepted: ["Alan"] }, city: { accepted: ["Wilmslow"] } } },
      { id: "r3", cells: { name: { accepted: ["Grace"] }, city: { accepted: ["Arlington"] } } },
    ],
    rowOrder: "any",
    evaluation: defaultEvaluation(),
    ...over,
  });

const answer = (rows: [string, string][]) => ({
  cells: Object.fromEntries(
    rows.flatMap(([name, city], index) => [
      [cellKey(`r${index + 1}`, "name"), name],
      [cellKey(`r${index + 1}`, "city"), city],
    ]),
  ),
});

describe("evaluate", () => {
  it("marks a result typed in another order as right when rows may come in any order", () => {
    const typed = answer([
      ["Grace", "Arlington"],
      ["Ada", "London"],
      ["Alan", "Wilmslow"],
    ]);
    expect(matchRows(query(), typed)).toEqual([2, 0, 1]);
    const result = evaluate({ data: query(), answer: typed });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 6, possible: 6 });
  });

  it("holds the same answer to its rows when the order is fixed", () => {
    const typed = answer([
      ["Grace", "Arlington"],
      ["Ada", "London"],
      ["Alan", "Wilmslow"],
    ]);
    const result = evaluate({ data: query({ rowOrder: "fixed" }), answer: typed });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 6 });
  });

  it("gives partial credit per cell, matching each row where it scores best", () => {
    const typed = answer([
      ["Alan", "London"],
      ["Ada", "London"],
      ["Grace", "Arlington"],
    ]);
    // Ada/London, Grace/Arlington and Alan's name are right: five of six.
    expect(evaluate({ data: query(), answer: typed }).score).toEqual({
      earned: 5,
      possible: 6,
    });
  });

  it("scores nothing for given cells", () => {
    const data = query({
      rowOrder: "fixed",
      rows: [
        { id: "r1", cells: { name: { given: "Ada" }, city: { accepted: ["London"] } } },
      ],
    });
    expect(evaluate({ data, answer: answer([["", "london"]]) }).score).toEqual({
      earned: 1,
      possible: 1,
    });
  });
});

describe("DataSchema", () => {
  it("wants something left blank to fill in", () => {
    const result = DataSchema.safeParse({
      columns: [{ id: "a", header: "a", kind: "text" }],
      rows: [{ id: "r", cells: { a: { given: "x" } } }],
      evaluation: defaultEvaluation(),
    });
    expect(result.success).toBe(false);
  });

  it("wants a cell under every column in every row", () => {
    const result = DataSchema.safeParse({
      columns: [
        { id: "a", header: "a", kind: "text" },
        { id: "b", header: "b", kind: "text" },
      ],
      rows: [{ id: "r", cells: { a: { accepted: ["x"] } } }],
      evaluation: defaultEvaluation(),
    });
    expect(result.success).toBe(false);
  });
});
