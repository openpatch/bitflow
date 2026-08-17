import { arithmeticMean } from "../src/mean";

describe("mean", () => {
  describe("arithmetic", () => {
    it("should calc mean", () => {
      const values = [3, 4, 4, 5, 6, 8];
      const m = arithmeticMean(values);
      expect(m).toBe(5);
    });
  });
});
