import { convertMapToTable, inverseTable, omitTableRows } from "../src/table";

describe("table", () => {
  describe("convertMapToTable", () => {
    it("should convert with gaps", () => {
      const map = { row1: { c1: 1, c2: 2 }, row2: { c1: 0, c3: 4 } };
      const table = convertMapToTable(map);

      expect(table).toEqual({
        rows: ["row1", "row2"],
        columns: ["c1", "c2", "c3"],
        cells: [
          [1, 2, null],
          [0, null, 4],
        ],
      });
    });
  });

  describe("omitTableRows", () => {
    it("should omit rows", () => {
      const table = {
        rows: ["r1", "r2", "r3"],
        columns: ["c1", "c2", "c3"],
        cells: [
          [1, 2, null],
          [0, null, 4],
          [1, 1, 1],
        ],
      };

      const omitted = omitTableRows(table);

      expect(omitted).toEqual({
        rows: ["r3"],
        columns: ["c1", "c2", "c3"],
        cells: [[1, 1, 1]],
      });
    });
  });

  describe("inverseTable", () => {
    it("should inverse a table", () => {
      const table = {
        rows: ["r1", "r2"],
        columns: ["c1", "c2", "c3"],
        cells: [
          [1, 2, null],
          [0, null, 4],
        ],
      };

      const inverse = inverseTable(table);
      expect(inverse).toEqual({
        rows: table.columns,
        columns: table.rows,
        cells: [
          [1, 0],
          [2, null],
          [null, 4],
        ],
      });
    });
  });
});
