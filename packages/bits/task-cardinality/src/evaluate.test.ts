import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, sameLabel } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const library = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    notation: "chen",
    entities: [
      { id: "pupil", name: "Pupil", x: 0.2, y: 0.5 },
      { id: "book", name: "Book", x: 0.8, y: 0.5 },
    ],
    relationships: [
      { id: "borrows", name: "borrows", from: "pupil", to: "book", expectedFrom: "1", expectedTo: "n" },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("sameLabel", () => {
  it("takes n and m as the same 'many' in Chen's notation, and nowhere else", () => {
    expect(sameLabel("chen", "n", "m")).toBe(true);
    expect(sameLabel("chen", "n", "1")).toBe(false);
    expect(sameLabel("uml", "*", "1..*")).toBe(false);
    expect(sameLabel("uml", "1", undefined)).toBe(false);
  });
});

describe("evaluate", () => {
  it("marks each end on its own, with partial credit", () => {
    const result = evaluate({
      data: library(),
      answer: { ends: { "borrows:from": "1", "borrows:to": "1" } },
    });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 1, possible: 2 });
    expect(result.detail).toEqual({ ends: { "borrows:from": "correct", "borrows:to": "wrong" } });
  });

  it("is correct when every end is", () => {
    const result = evaluate({
      data: library(),
      answer: { ends: { "borrows:from": "1", "borrows:to": "m" } },
    });
    expect(result.state).toBe("correct");
  });
});

describe("DataSchema", () => {
  it("wants an answer the notation offers at every end", () => {
    const result = DataSchema.safeParse({
      ...library(),
      notation: "uml",
    });
    expect(result.success).toBe(false);
  });

  it("refuses a relationship to an entity that does not exist", () => {
    const result = DataSchema.safeParse({
      ...library(),
      relationships: [
        { id: "r", name: "", from: "pupil", to: "ghost", expectedFrom: "1", expectedTo: "1" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("refuses a relationship from an entity to itself", () => {
    const result = DataSchema.safeParse({
      ...library(),
      relationships: [
        { id: "r", name: "", from: "pupil", to: "pupil", expectedFrom: "1", expectedTo: "1" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
