import { FlowStartNode, FlowStartPublicNode } from "@bitflow/core";
import { useBitStart } from "@bitflow/provider";
import { StartShell } from "@bitflow/shell";
import { DoPropsBase } from "./types";

export const DoStart = ({
  onNext,
  node,
}: Pick<DoPropsBase, "onNext" | "node"> & {
  node: FlowStartNode | FlowStartPublicNode;
}) => {
  const startBit = useBitStart(node.data.subtype);
  if (!startBit) {
    throw new Error(
      "start subtype not supported. Please check your provider config."
    );
  }
  return (
    <StartShell
      StartComponent={startBit.Start}
      start={node.data}
      onNext={onNext}
    />
  );
};
