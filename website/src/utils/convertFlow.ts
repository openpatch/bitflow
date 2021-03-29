import { FlowSchema, IFlow } from "@bitflow/flow";

export const convertFromJsonToString = (flow: IFlow): string => {
  return btoa(JSON.stringify(flow));
};

export const convertFromStringToJson = (flow: string): IFlow => {
  const jsonString = atob(flow);
  return FlowSchema.parse(JSON.parse(jsonString));
};
