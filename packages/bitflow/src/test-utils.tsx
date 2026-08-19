import {
  clearBits,
  registerBit,
  type BitflowDocument,
  type BitNode,
  type BitEdge,
  type BitFormProps,
  type BitTaskProps,
} from "@bitflow/core";
import { z } from "zod";

/**
 * Test bits for this package. Deliberately not the real ones: `bitflow` must
 * keep working without importing any bit package, and a test that pulled one
 * in would hide a dependency-direction mistake.
 */

type TaskData = { prompt: string; correct: string };
type TaskAnswer = { text: string };

const TestTask = ({
  data,
  answer,
  readonly,
  onAnswerChange,
}: BitTaskProps<TaskData, TaskAnswer>) => (
  <label>
    {data.prompt}
    <input
      aria-label={data.prompt}
      value={answer?.text ?? ""}
      disabled={readonly}
      onChange={(event) => onAnswerChange({ text: event.target.value })}
    />
  </label>
);

export const registerTestBits = (): void => {
  clearBits();

  registerBit({
    type: "test-start",
    kind: "start",
    schema: z.object({ title: z.string().default("") }),
    defaultData: () => ({ title: "" }),
    info: () => ({ name: "Start", description: "" }),
    Task: ({ data }: BitTaskProps<{ title: string }>) => <h1>{data.title}</h1>,
  });

  registerBit({
    type: "test-content",
    kind: "content",
    schema: z.object({ text: z.string().default("") }),
    defaultData: () => ({ text: "" }),
    info: () => ({ name: "Content", description: "" }),
    Task: ({ data }: BitTaskProps<{ text: string }>) => <p>{data.text}</p>,
  });

  registerBit<TaskData, TaskAnswer>({
    type: "test-task",
    kind: "task",
    schema: z.object({ prompt: z.string(), correct: z.string() }),
    defaultData: () => ({ prompt: "", correct: "" }),
    info: () => ({ name: "Task", description: "" }),
    Task: TestTask,
    evaluate: ({ data, answer }) => ({
      state: answer?.text === data.correct ? "correct" : "wrong",
      allowRetry: true,
    }),
  });

  // The only test bit with an authoring form, and one written the way real
  // ones are: it reads its list straight, without checking that it is there.
  registerBit({
    type: "test-form",
    kind: "content",
    schema: z.object({
      label: z.string().default(""),
      items: z.array(z.string()).default([]),
    }),
    defaultData: () => ({ label: "", items: [] }),
    info: () => ({ name: "Form", description: "" }),
    Task: ({ data }: BitTaskProps<{ label: string }>) => <p>{data.label}</p>,
    Form: ({ data, onChange }: BitFormProps<{ label: string; items: string[] }>) => (
      <>
        <label>
          Label
          <input
            value={data.label}
            onChange={(event) => onChange({ ...data, label: event.target.value })}
          />
        </label>
        <ul>
          {data.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </>
    ),
  });

  registerBit({
    type: "test-end",
    kind: "end",
    schema: z.object({}),
    defaultData: () => ({}),
    info: () => ({ name: "End", description: "" }),
    Task: () => <p>Done</p>,
  });
};

export const node = (
  id: string,
  type: string,
  data: Record<string, unknown> = {},
): BitNode => ({ id, type, position: { x: 0, y: 0 }, data });

export const edge = (
  source: string,
  target: string,
  extra: Partial<BitEdge> = {},
): BitEdge => ({ id: `${source}->${target}`, source, target, ...extra });

export const doc = (
  nodes: BitNode[],
  edges: BitEdge[],
  meta: Partial<BitflowDocument["meta"]> = {},
): BitflowDocument => ({
  version: 1,
  meta: {
    id: "test-flow",
    title: "Test flow",
    locale: "en",
    askConfidence: false,
    askReasoning: false,
    pools: [],
    ...meta,
  },
  nodes,
  edges,
});

/** Start → task → end, the smallest flow with something to answer. */
export const simpleFlow = doc(
  [
    node("start", "test-start", { title: "Welcome" }),
    node("q", "test-task", { prompt: "Capital of France?", correct: "Paris" }),
    node("end", "test-end"),
  ],
  [edge("start", "q"), edge("q", "end")],
);
