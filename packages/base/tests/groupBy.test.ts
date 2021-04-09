import { groupBy } from "../src/groupBy";

describe("groupBy", () => {
  it("should group", () => {
    const arr = [
      {
        id: 0,
        key: "a",
      },
      {
        id: 1,
        key: "b",
      },
      {
        id: 2,
        key: "a",
      },
      {
        id: 3,
        key: "a",
      },
      {
        id: 4,
        key: "c",
      },
    ];

    const grouped = groupBy(arr, (v) => v.key);

    expect(grouped).toEqual([
      [
        { id: 0, key: "a" },
        { id: 2, key: "a" },
        { id: 3, key: "a" },
      ],
      [{ id: 1, key: "b" }],
      [{ id: 4, key: "c" }],
    ]);
  });
});
