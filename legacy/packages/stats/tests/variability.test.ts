import { variance } from "../src/variability";

describe("variability", () => {
  describe("variance", () => {
    it("should calc variance", () => {
      const values = [6, 5, 9, 3, 2, 1, 5];
      const v = variance(values);
      expect(v).toBeCloseTo(7.29);
    });
  });
});
