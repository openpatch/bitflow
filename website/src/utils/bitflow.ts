import {
  makeEvaluate,
  makeFlowNodeSchema,
  makeFlowSchema,
} from "@bitflow/core";
import { schemas, evaluate as bitEvaluate } from "@bitflow/bits";


export const FlowNodeSchema = makeFlowNodeSchema(schemas);

export const FlowSchema = makeFlowSchema(schemas);

export const evaluate = makeEvaluate(bitEvaluate);
