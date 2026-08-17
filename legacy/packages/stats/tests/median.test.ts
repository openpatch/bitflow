import { median, quartile } from "../src/median";
describe("median", () => {
  it("should calculate mean for even length", () => {
    const v = [1, 2, 3, 4];
    expect(median(v)).toBe(2.5);
  });

  it("should calculate mean for odd length", () => {
    const v = [1, 2, 3, 4, 5];
    expect(median(v)).toBe(3);
  });
  it("should calculate mean for odd length", () => {
    const v = [6, 7, 15];
    expect(median(v)).toBe(7);
  });
});

describe("quartile", () => {
  const v = [6, 7, 15, 36, 39, 40, 41, 42, 43, 47, 49];
  it("should calculate 25% quartile", () => {
    expect(quartile(v, "first")).toBe(15);
  });
  it("should calculate 75% quartile", () => {
    expect(quartile(v, "third")).toBe(43);
  });
});
