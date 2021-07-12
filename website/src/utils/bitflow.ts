import {
  makeEvaluate,
  makeFlowNodeSchema,
  makeFlowSchema,
} from "@bitflow/core";
import { EndSchema as EndTriesSchema } from "@bitflow/end-tries";
import { InputSchema as InputMarkdownSchema } from "@bitflow/input-markdown";
import { StartSchema as StartSimpleSchema } from "@bitflow/start-simple";
import {
  evaluate as evaluateChocie,
  TaskSchema as TaskChoiceSchema,
} from "@bitflow/task-choice";
import {
  evaluate as evaluateFITB,
  TaskSchema as TaskFITBSchema,
} from "@bitflow/task-fill-in-the-blank";
import {
  evaluate as evaluateInput,
  TaskSchema as TaskInputSchema,
} from "@bitflow/task-input";
import { TitleSchema as TitleSimpleSchema } from "@bitflow/title-simple";
import { z } from "zod";

const bits = {
  end: EndTriesSchema,
  start: StartSimpleSchema,
  input: InputMarkdownSchema,
  title: TitleSimpleSchema,
  task: z.union([TaskChoiceSchema, TaskFITBSchema, TaskInputSchema]),
};

export const FlowNodeSchema = makeFlowNodeSchema(bits);

export const FlowSchema = makeFlowSchema(bits);

export const evaluate = makeEvaluate({
  choice: evaluateChocie as any,
  "fill-in-the-blank": evaluateFITB as any,
  input: evaluateInput as any,
});
