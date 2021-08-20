import {
  EndBit,
  Evaluate,
  Flow,
  FlowNode,
  InputBit,
  makeFlowNodeSchema,
  makeFlowSchema,
  StartBit,
  TaskBit,
  TitleBit,
} from "@bitflow/core";
import { useRef } from "react";
import { z, ZodSchema } from "zod";
import { useBits } from "./useBit";

export const useFlow = () => {
  const taskBits = useBits("task");
  const titleBits = useBits("title");
  const startBits = useBits("start");
  const endBits = useBits("end");
  const inputBits = useBits("input");
  const FlowSchema = useRef<ZodSchema<Flow>>();
  const FlowNodeSchema = useRef<ZodSchema<FlowNode>>();

  const evaluateMap = useRef<
    Partial<
      Record<
        Bitflow.Task["subtype"],
        Evaluate<Bitflow.TaskAnswer, Bitflow.Task, Bitflow.TaskResult>
      >
    >
  >({});

  if (!FlowSchema.current || !FlowNodeSchema.current) {
    let titleBitsSchema: TitleBit["TitleSchema"] | null = null;
    for (const key in titleBits) {
      const b = titleBits[key];
      if (!titleBitsSchema) {
        titleBitsSchema = b.TitleSchema;
      } else {
        titleBitsSchema = titleBitsSchema.or(b.TitleSchema);
      }
    }

    let startBitsSchema: StartBit["StartSchema"] | null = null;
    for (const key in startBits) {
      const b = startBits[key];
      if (!startBitsSchema) {
        startBitsSchema = b.StartSchema;
      } else {
        startBitsSchema = startBitsSchema.or(b.StartSchema);
      }
    }

    let inputBitsSchema: InputBit["InputSchema"] | null = null;
    for (const key in inputBits) {
      const b = inputBits[key];
      if (!inputBitsSchema) {
        inputBitsSchema = b.InputSchema;
      } else {
        inputBitsSchema = inputBitsSchema.or(b.InputSchema);
      }
    }

    let endBitsSchema: EndBit["EndSchema"] | null = null;
    for (const key in endBits) {
      const endBit = endBits[key];
      if (!endBitsSchema) {
        endBitsSchema = endBit.EndSchema;
      } else {
        endBitsSchema = endBitsSchema.or(endBit.EndSchema);
      }
    }

    let taskBitsSchema: TaskBit["TaskSchema"] | null = null;
    for (const key in taskBits) {
      const b: TaskBit = taskBits[key];
      evaluateMap.current[key] = b.evaluate;
      if (!taskBitsSchema) {
        taskBitsSchema = b.TaskSchema;
      } else {
        taskBitsSchema = taskBitsSchema.or(b.TaskSchema);
      }
    }

    FlowSchema.current = makeFlowSchema({
      end: endBitsSchema ?? z.never(),
      task: taskBitsSchema ?? z.never(),
      input: inputBitsSchema ?? z.never(),
      title: titleBitsSchema ?? z.never(),
      start: startBitsSchema ?? z.never(),
    });
    FlowNodeSchema.current = makeFlowNodeSchema({
      end: endBitsSchema ?? z.never(),
      task: taskBitsSchema ?? z.never(),
      input: inputBitsSchema ?? z.never(),
      title: titleBitsSchema ?? z.never(),
      start: startBitsSchema ?? z.never(),
    });
  }

  const evaluate: Evaluate<
    Bitflow.TaskAnswer,
    Bitflow.Task,
    Bitflow.TaskResult
  > = async ({ task, answer }) => {
    console.log(evaluateMap.current);
    const evaluateTask = evaluateMap.current[task.subtype];
    if (!evaluateTask) {
      throw new Error(
        `subtype ${task.subtype} not supported. Please see your provider config.`
      );
    }
    return evaluateTask({ answer, task });
  };

  return {
    FlowSchema: FlowSchema.current,
    FlowNodeSchema: FlowNodeSchema.current,
    evaluate,
  };
};
