import { titleBits } from "@bitflow/bits";
import { TitleShell } from "@bitflow/shell";
import { FlowDoX } from ".";

export const FlowDoTitle = ({
  onNext,
  node,
  onClose,
  onPrevious,
}: Pick<FlowDoX, "onNext" | "node" | "onClose" | "onPrevious"> & {
  node: { type: "title" };
}) => {
  const titleBit = titleBits[node.data.subtype];
  return (
    <TitleShell<any>
      TitleComponent={titleBit.Title}
      title={node.data}
      onNext={onNext}
      onClose={onClose}
      onPrevious={onPrevious}
    />
  );
};
