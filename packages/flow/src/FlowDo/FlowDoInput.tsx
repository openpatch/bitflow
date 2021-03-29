import { inputBits } from "@bitflow/bits";
import { InputShell } from "@bitflow/shell";
import { FlowDoX } from ".";

export const FlowDoInput = ({
  onNext,
  node,
  onClose,
  onPrevious,
}: Pick<FlowDoX, "onNext" | "node" | "onClose" | "onPrevious"> & {
  node: { type: "input" };
}) => {
  const inputBit = inputBits[node.data.subtype];
  return (
    <InputShell<any>
      InputComponent={inputBit.Input}
      title="Input"
      input={node.data}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
