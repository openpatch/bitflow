import { DoResult, finishDoTry, skipDoTry } from "../src/do";

describe("do", () => {
  it("it should finish do try and decrease points", () => {
    const doResult: DoResult = {
      maxPoints: 1,
      points: 1,
      startDate: new Date(),
      endDate: new Date(),
      tries: [
        {
          status: "finished",
          endDate: new Date(),
          startDate: new Date(),
          node: {
            id: "1",
          } as any,
          try: 0,
          result: {
            state: "wrong",
          } as any,
        },
        {
          status: "finished",
          endDate: new Date(),
          startDate: new Date(),
          node: {
            id: "1",
          } as any,
          try: 1,
          result: {
            state: "correct",
          } as any,
        },
        {
          status: "started",
          startDate: new Date(),
          node: {
            id: "1",
          } as any,
          try: 2,
        },
      ],
    };

    const newDoResult = finishDoTry(doResult, undefined, {
      state: "wrong",
      subtype: "choice",
    });

    expect(newDoResult.points).toEqual(doResult.points - 1);
  });
  it("it should skip do try and increase max points", () => {
    const result: DoResult = {
      maxPoints: 0,
      points: 0,
      startDate: new Date(),
      tries: [
        {
          status: "started",
          startDate: new Date(),
          try: 0,
          node: {} as any,
        },
      ],
      endDate: new Date(),
    };
    const newResult = skipDoTry(result, { mode: "auto" });
    expect(newResult.maxPoints).toEqual(result.maxPoints + 1);
  });

  it("it should skip do try and not increase max points", () => {
    const result: DoResult = {
      maxPoints: 0,
      points: 0,
      startDate: new Date(),
      tries: [
        {
          status: "started",
          startDate: new Date(),
          try: 0,
          node: {} as any,
        },
      ],
      endDate: new Date(),
    };
    const newResult = skipDoTry(result, { mode: "skip" });
    expect(newResult.maxPoints).toEqual(result.maxPoints);
  });

  it("it should start do try and increase max points", () => {
    const result: DoResult = {
      maxPoints: 0,
      points: 0,
      startDate: new Date(),
      tries: [
        {
          status: "started",
          startDate: new Date(),
          try: 0,
          node: {} as any,
        },
      ],
      endDate: new Date(),
    };
    const newResult = skipDoTry(result, { mode: "auto" });
    expect(newResult.maxPoints).toEqual(result.maxPoints + 1);
  });
});
