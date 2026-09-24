import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, wrongCells } from "./evaluate";
import { DataSchema, effectiveCells, type Data } from "./schema";

const W = "white";
const B = "black";

const cross = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    rows: 2,
    columns: 2,
    target: [
      [B, W],
      [W, B],
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("DataSchema", () => {
  it("refuses a picture that does not fit the grid", () => {
    const result = DataSchema.safeParse({
      rows: 2,
      columns: 2,
      target: [[B, W]],
      evaluation: defaultEvaluation(),
    });
    expect(result.success).toBe(false);
  });

  it("refuses a colour that is not in the palette", () => {
    const result = DataSchema.safeParse({
      rows: 1,
      columns: 1,
      target: [["red"]],
      evaluation: defaultEvaluation(),
    });
    expect(result.success).toBe(false);
  });
});

describe("evaluate", () => {
  it("counts every free cell with partial credit", () => {
    const result = evaluate({
      data: cross(),
      answer: { cells: [[B, W], [W, W]] },
    });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 3, possible: 4 });
    expect(wrongCells(cross(), { cells: [[B, W], [W, W]] })).toEqual([
      [false, false],
      [false, true],
    ]);
  });

  it("reads an unpainted cell as the starting colour", () => {
    // Only the black cells need painting; the rest start white.
    const result = evaluate({ data: cross(), answer: { cells: [[B], [W, B]] } });
    expect(result.state).toBe("correct");
  });

  it("neither scores nor holds against the learner a locked cell", () => {
    const data = cross({
      given: [
        [true, false],
        [false, false],
      ],
    });
    const result = evaluate({ data, answer: { cells: [[W, W], [W, B]] } });
    expect(result.score).toEqual({ earned: 3, possible: 3 });
    // And the learner sees the locked cell as the picture has it.
    expect(effectiveCells(data, [[W, W], [W, B]])[0][0]).toBe(B);
  });

  it("is all or nothing without partial credit", () => {
    const result = evaluate({
      data: cross({ partialCredit: false }),
      answer: { cells: [[B, W], [W, W]] },
    });
    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });
});
