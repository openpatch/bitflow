import { Flow } from "@bitflow/core";
import lz from "lz-string";
import { FlowSchema } from "./bitflow";

export const convertFromJsonToString = (flow: Flow): string | null => {
  return lz.compressToEncodedURIComponent(JSON.stringify(flow));
};

export const convertFromStringToJson = (flow: string): Flow | null => {
  const jsonString = lz.decompressFromEncodedURIComponent(flow);
  if (jsonString) {
    return FlowSchema.parse(JSON.parse(jsonString));
  }
  return null;
};
