import { FlowDoX } from ".";
import { StartShell } from "../StartShell";

export const FlowDoStart = ({
  onNext,
  node,
}: Pick<FlowDoX, "onNext" | "node"> & {
  node: { type: "start" };
}) => {
  return <StartShell start={node.data} onNext={onNext} />;
};
