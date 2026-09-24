import { describe, expect, it } from "vitest";
import { parseDelimited, tableFromPaste } from "./paste";

describe("parseDelimited", () => {
  it("reads tab-separated rows, the way a spreadsheet copies them", () => {
    expect(parseDelimited("a\tb\n1\t2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("reads comma-separated rows with quoted commas", () => {
    expect(parseDelimited('name,city\n"Smith, Ada",London')).toEqual([
      ["name", "city"],
      ["Smith, Ada", "London"],
    ]);
  });
});

describe("tableFromPaste", () => {
  it("makes headings of the first line and given cells of the rest", () => {
    const table = tableFromPaste("name\tcity\nAda\tLondon");
    expect(table?.columns.map((column) => column.header)).toEqual(["name", "city"]);
    expect(table?.rows[0].cells).toEqual({
      "column-1": { given: "Ada" },
      "column-2": { given: "London" },
    });
  });

  it("makes blanks to fill in of the rest when pasting an answer key", () => {
    const table = tableFromPaste("name\tcity\nAda\tLondon", "blank");
    expect(table?.rows[0].cells["column-1"]).toEqual({ accepted: ["Ada"] });
  });

  it("gives nothing back for nothing pasted", () => {
    expect(tableFromPaste("  \n")).toBeUndefined();
  });
});
