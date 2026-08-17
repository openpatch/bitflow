import { levenshtein } from "../src/levenshtein";

describe("levenshtein", () => {
  it("should notice same", () => {
    expect(levenshtein("a", "a")).toBe(0);
  });
  it("shoud calculate difference", () => {
    expect(levenshtein("a", "b")).toBe(1);
    expect(levenshtein("ab", "ac")).toBe(1);
    expect(levenshtein("ac", "bc")).toBe(1);
    expect(levenshtein("abc", "axc")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("xabxcdxxefxgx", "1ab2cd34ef5g6")).toBe(6);
    expect(levenshtein("cat", "cow")).toBe(2);
    expect(levenshtein("xabxcdxxefxgx", "abcdefg")).toBe(6);
    expect(levenshtein("javawasneat", "scalaisgreat")).toBe(7);
    expect(levenshtein("example", "samples")).toBe(3);
    expect(levenshtein("sturgeon", "urgently")).toBe(6);
    expect(levenshtein("levenshtein", "frankenstein")).toBe(6);
    expect(levenshtein("distance", "difference")).toBe(5);
    expect(
      levenshtein(
        "因為我是中國人所以我會說中文",
        "因為我是英國人所以我會說英文"
      )
    ).toBe(2);
  });
});
