import { FlowSchema, IFlow } from "@bitflow/flow";
import lz from "lz-string";

export const convertFromJsonToString = (flow: IFlow): string | null => {
  return lz.compressToEncodedURIComponent(JSON.stringify(flow));
};

export const convertFromStringToJson = (flow: string): IFlow | null => {
  const jsonString = lz.decompressFromEncodedURIComponent(flow);
  if (jsonString) {
    return FlowSchema.parse(JSON.parse(jsonString));
  }
  return null;
};
