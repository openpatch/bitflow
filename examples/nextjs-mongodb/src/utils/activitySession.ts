import { TaskAnswer, TaskResult } from "@bitflow/base";
import {
  FlowConfig,
  FlowDoProps,
  FlowProgress,
  FlowResult,
  IFlowNode,
} from "@bitflow/flow";
import { get, post } from "@utils/fetcher";

const makeUrl = (path: string) => "/api/do/" + path;

export const start = async (activityId: string) => {
  const res = await post<
    {
      activityId: string;
    },
    {
      session: string;
    }
  >(makeUrl("start"), { activityId }).then((r) => r.json());
  return { session: res.session };
};

export const getConfig: FlowDoProps["getConfig"] = async () => {
  const res = await get<{ config: FlowConfig }>(makeUrl("config")).then((r) =>
    r.json()
  );
  if (!res) {
    throw new Error("No config found");
  }
  return res.config;
};

export const getCurrent: FlowDoProps["getCurrent"] = async () => {
  const res = await get<{
    node: IFlowNode;
  }>(makeUrl("current")).then((r) => r.json());

  return res.node;
};

export const onEnd: FlowDoProps["onEnd"] = async () => {
  await get(makeUrl("end"));
};

export const onSkip: FlowDoProps["onSkip"] = async () => {
  await get(makeUrl("skip"));
};

export const evaluate: FlowDoProps["evaluate"] = async (answer) => {
  const res = await post<
    { answer: TaskAnswer },
    {
      result: TaskResult;
    }
  >(makeUrl("evaluate"), { answer }).then((r) => r.json());

  return res.result;
};

export const getNext: FlowDoProps["getNext"] = async () => {
  const res = await get<{ node: IFlowNode }>(makeUrl("next")).then((r) =>
    r.json()
  );
  return res.node;
};

export const getPrevious: FlowDoProps["getPrevious"] = async () => {
  const res = await get<{ node: IFlowNode }>(makeUrl("previous")).then((r) =>
    r.json()
  );
  return res.node;
};

export const getProgress: FlowDoProps["getProgress"] = async () => {
  const res = await get<{ progress: FlowProgress }>(
    makeUrl("progress")
  ).then((r) => r.json());
  return res.progress;
};

export const getResult: FlowDoProps["getResult"] = async () => {
  const res = await get<{ result: FlowResult }>(makeUrl("result")).then((r) =>
    r.json()
  );
  return res.result;
};
