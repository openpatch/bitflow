import { cronbachsAlpha } from "../src/cronbachsAlpha";

describe("cronbachs alpha", () => {
  it("should calculate correctly", () => {
    const matrix = [
      [6, 5, 9, 3, 2, 1, 5],
      [6, 5, 8, 2, 3, 1, 4],
      [8, 6, 6, 4, 2, 2, 6],
    ];
    const alpha = cronbachsAlpha(matrix);
    expect(alpha).toBeCloseTo(0.941);
  });
});
