import {
  canGoPrevious,
  canGoTo,
  createAttempt,
  evaluateNode,
  getBit,
  getNode,
  goNext,
  goPrevious,
  goTo,
  parseFlow,
  restoreAttempt,
  retryNode,
  setAnswer as setAnswerIn,
  setConfidence as setConfidenceIn,
  setReasoning as setReasoningIn,
  skipNode,
  type AttemptSnapshot,
  type BitflowDocument,
  type BitflowError,
  type BitNode,
  type Confidence,
} from "@bitflow/core";
import { createStore, type StoreApi } from "zustand";

/**
 * Callbacks the host wires up. They are the *only* way state leaves the flow:
 * bitflow never writes to storage itself, because identity, retention and sync
 * policy belong to the embedding application.
 */
export type FlowCallbacks = {
  /** Every durable learner-state change. Never presentation-only changes. */
  onStateChange?: (attempt: AttemptSnapshot) => void;
  /** The explicit Save action, or `save()`. */
  onSave?: (attempt: AttemptSnapshot) => void;
  onComplete?: (attempt: AttemptSnapshot) => void;
  onError?: (error: BitflowError) => void;
};

export type FlowState = {
  doc: BitflowDocument | null;
  attempt: AttemptSnapshot | null;
  /**
   * The answer being edited on the current node, before it is checked. Kept
   * apart from `attempt.answers` so that typing does not emit a state change
   * per keystroke; it is committed on check, skip or navigation.
   */
  draft: unknown;
  /** True while an evaluator is running. */
  busy: boolean;
  error: BitflowError | null;

  loadFlow: (input: unknown) => void;
  loadAttempt: (input: unknown) => void;
  setDraft: (answer: unknown) => void;
  check: () => Promise<void>;
  retry: () => void;
  skip: () => void;
  next: () => void;
  previous: () => void;
  /** Jumps back to a step already visited, when the flow allows it. */
  goTo: (nodeId: string) => void;
  setConfidence: (confidence: Confidence) => void;
  setReasoning: (reasoning: string) => void;
  reset: () => void;
  /** Ends the attempt where it stands — what a whole-flow time limit does. */
  finish: () => void;
  save: () => AttemptSnapshot | null;

  currentNode: () => BitNode | null;
  canGoBack: () => boolean;
  canJumpTo: (nodeId: string) => boolean;
};

export const createFlowStore = (
  callbacks: FlowCallbacks = {},
): StoreApi<FlowState> =>
  createStore<FlowState>((set, get) => {
    const fail = (error: BitflowError) => {
      set({ error });
      callbacks.onError?.(error);
    };

    /**
     * The single place a durable change is published. Everything that mutates
     * the attempt goes through here, so `bitflow-statechange` cannot drift out
     * of step with what is actually stored.
     *
     * `draft` is wrapped rather than passed bare so that "leave the draft
     * alone" and "clear the draft" are different calls. Passing `undefined` for
     * both meant `reset()` left the previous answer sitting in the UI.
     */
    const commit = (
      attempt: AttemptSnapshot,
      draft?: { value: unknown },
    ) => {
      set(draft ? { attempt, draft: draft.value } : { attempt });
      callbacks.onStateChange?.(attempt);
      if (attempt.status === "completed") callbacks.onComplete?.(attempt);
    };

    return {
      doc: null,
      attempt: null,
      draft: undefined,
      busy: false,
      error: null,

      loadFlow: (input) => {
        const parsed = parseFlow(input);
        if (!parsed.ok) {
          fail(parsed.error);
          return;
        }
        const created = createAttempt(parsed.value);
        if (!created.ok) {
          fail(created.error);
          return;
        }
        // Loading a flow is not a learner edit, so no state change is emitted.
        set({
          doc: parsed.value,
          attempt: created.value,
          draft: undefined,
          error: null,
        });
      },

      loadAttempt: (input) => {
        const { doc } = get();
        if (!doc) {
          fail({
            code: "INVALID_ATTEMPT",
            message: "An attempt cannot be restored before a flow is loaded.",
          });
          return;
        }
        const restored = restoreAttempt(doc, input);
        if (!restored.ok) {
          // Atomic on purpose: a rejected snapshot leaves the learner's current
          // attempt exactly as it was rather than half-replacing it.
          fail(restored.error);
          return;
        }
        set({
          attempt: restored.value,
          draft: restored.value.answers[restored.value.currentNodeId],
          error: null,
        });
      },

      // Presentation-only until it is committed, so this deliberately does not
      // publish a state change.
      setDraft: (answer) => set({ draft: answer }),

      check: async () => {
        const { doc, attempt, draft, busy } = get();
        if (!doc || !attempt || busy) return;

        set({ busy: true });
        const evaluated = await evaluateNode(
          doc,
          attempt,
          attempt.currentNodeId,
          draft,
        );
        set({ busy: false });

        if (!evaluated.ok) {
          fail(evaluated.error);
          return;
        }
        commit(evaluated.value);
      },

      retry: () => {
        const { attempt } = get();
        if (!attempt) return;
        // The answer stays put: trying again means adjusting what you wrote,
        // not starting from a blank.
        commit(retryNode(attempt, attempt.currentNodeId));
      },

      skip: () => {
        const { attempt } = get();
        if (!attempt) return;
        commit(skipNode(attempt, attempt.currentNodeId));
      },

      next: () => {
        const { doc, attempt, draft } = get();
        if (!doc || !attempt) return;

        // Commit the draft first: a content bit is never "checked", so this is
        // the only chance to keep what the learner typed.
        const withAnswer =
          draft === undefined
            ? attempt
            : setAnswerIn(attempt, attempt.currentNodeId, draft);

        const advanced = goNext(doc, withAnswer);
        commit(advanced, { value: advanced.answers[advanced.currentNodeId] });
      },

      previous: () => {
        const { doc, attempt, draft } = get();
        if (!doc || !attempt) return;
        // The draft is kept on the way back for the same reason it is kept on
        // the way forward: a content step is never checked, and losing what
        // they typed because they looked at the previous page would be theft.
        const withAnswer =
          draft === undefined
            ? attempt
            : setAnswerIn(attempt, attempt.currentNodeId, draft);
        const back = goPrevious(doc, withAnswer);
        commit(back, { value: back.answers[back.currentNodeId] });
      },

      goTo: (nodeId) => {
        const { doc, attempt, draft } = get();
        if (!doc || !attempt) return;
        const withAnswer =
          draft === undefined
            ? attempt
            : setAnswerIn(attempt, attempt.currentNodeId, draft);
        const moved = goTo(doc, withAnswer, nodeId);
        commit(moved, { value: moved.answers[moved.currentNodeId] });
      },

      setConfidence: (confidence) => {
        const { attempt } = get();
        if (!attempt) return;
        commit(setConfidenceIn(attempt, attempt.currentNodeId, confidence));
      },

      setReasoning: (reasoning) => {
        const { attempt } = get();
        if (!attempt) return;
        commit(setReasoningIn(attempt, attempt.currentNodeId, reasoning));
      },

      reset: () => {
        const { doc } = get();
        if (!doc) return;
        const created = createAttempt(doc);
        if (!created.ok) {
          fail(created.error);
          return;
        }
        // A fresh attempt starts with a blank answer, not the last one.
        commit(created.value, { value: undefined });
      },

      finish: () => {
        const { attempt } = get();
        if (!attempt || attempt.status !== "inProgress") return;
        const now = new Date();
        commit({
          ...attempt,
          status: "completed",
          completedAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      },

      save: () => {
        const { attempt } = get();
        if (attempt) callbacks.onSave?.(attempt);
        return attempt;
      },

      currentNode: () => {
        const { doc, attempt } = get();
        if (!doc || !attempt) return null;
        return getNode(doc, attempt.currentNodeId) ?? null;
      },

      canGoBack: () => {
        const { doc, attempt } = get();
        return Boolean(doc && attempt && canGoPrevious(doc, attempt));
      },

      canJumpTo: (nodeId) => {
        const { doc, attempt } = get();
        return Boolean(doc && attempt && canGoTo(doc, attempt, nodeId));
      },
    };
  });

/** Whether the node the learner is on can be answered and graded. */
export const isTaskNode = (node: BitNode | null): boolean =>
  Boolean(node && getBit(node.type)?.kind === "task");
