import { Shell, ShellContent, ShellFooter, ShellHeader } from "@bitflow/shell";
import { ButtonPrimary } from "@openpatch/patches";
import { FlowDoX } from ".";

export const FlowDoCheckpoint = ({ onNext }: Pick<FlowDoX, "onNext">) => {
  return (
    <Shell>
      <ShellHeader>Checkpoint</ShellHeader>
      <ShellContent>
        You reached a checkpoint and can not go back to a previous task.
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary onClick={onNext}>Start</ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
