import {
  answerAction,
  initialState,
  noAction,
  reducer,
  yesAction,
} from "../src/reducer";

describe("reducer", () => {
  it("should accept yes action", () => {
    const newState = reducer(initialState, yesAction());
    expect(newState.yes).toBeTruthy();
  });
  it("should accept no action", () => {
    const newState = reducer(initialState, noAction());
    expect(newState.yes).toBeFalsy();
  });
  it("should accept answer action", () => {
    const newState = reducer(
      initialState,
      answerAction({
        answer: {
          subtype: "highlighting",
          yes: true,
        },
      })
    );
    expect(newState.yes).toBeTruthy();
  });
});
