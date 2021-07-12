import { FlowEndNode, FlowEndPublicNode } from "@bitflow/core";
import { useBitEnd } from "@bitflow/provider";
import { EndShell } from "@bitflow/shell";
import { DoPropsBase } from "./types";

export const DoEnd = ({
  onNext,
  getResult,
  node,
}: Pick<DoPropsBase, "getResult" | "onNext" | "node"> & {
  node: FlowEndNode | FlowEndPublicNode;
}) => {
  const endBit = useBitEnd(node.data.subtype);
  if (!endBit) {
    return <div />;
  }
  return (
    <EndShell
      EndComponent={endBit.End}
      onNext={onNext}
      end={node.data}
      getResult={getResult}
    />
  );
};
