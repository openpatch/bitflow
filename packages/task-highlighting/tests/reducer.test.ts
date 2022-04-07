import {
  answerAction,
  initialState,
  reducer,
  eraseAction,
  resetAction,
  selectAction,
  initTextAction,
  highlightAction,
} from "../src/reducer";

describe("reducer", () => {
  it("should accept select action", () => {
    const newState = reducer(initialState, selectAction(0, 2));
    expect(newState.selection).toStrictEqual({ from: 0, to: 2 });
  });
  it("should accept init text action", () => {
    const text = "Hallo";
    const newState = reducer(initialState, initTextAction(text));
    expect(newState.highlights.length).toBe(text.length);
    newState.highlights.forEach((h) => expect(h).toBeNull());
  });
  it("should accept reset action", () => {
    const newState = reducer(
      { ...initialState, highlights: ["blue", "maroon", null] },
      resetAction()
    );
    expect(newState.highlights.length).toBe(3);
    newState.highlights.forEach((h) => expect(h).toBeNull());
  });
  it("should accept highlight action", () => {
    const text = "Hallo";
    const stateWithoutHighlight = reducer(initialState, initTextAction(text));
    const stateAfterHighlight = reducer(
      stateWithoutHighlight,
      highlightAction("maroon")
    );
    expect(stateAfterHighlight).toStrictEqual(stateWithoutHighlight);
  });
  it("should select and highlight", () => {
    const text = "Hallo";
    const stateWithoutHighlight = reducer(initialState, initTextAction(text));
    let state = reducer(stateWithoutHighlight, selectAction(0, 2));
    state = reducer(state, highlightAction("blue"));
    expect(state.highlights).toEqual(["blue", "blue", null, null, null]);
  });
});
