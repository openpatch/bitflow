import { lerpColor } from "../src/lerpColor";

describe("lerpColor", () => {
  it("should lerp color", () => {
    const color = lerpColor("#00000", "#FFFFFF", 0.5);
    expect(color).toEqual("#7f7f7f");
  });
});
