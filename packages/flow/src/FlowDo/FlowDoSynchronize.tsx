import { Shell, ShellContent, ShellFooter, ShellHeader } from "@bitflow/shell";
import { Box, ButtonPrimary, ButtonSecondary } from "@openpatch/patches";
import { useEffect, useState } from "react";
import { FlowDoX, FlowProgress } from ".";

export const FlowDoSynchronize = ({
  onNext,
  getProgress,
}: Pick<FlowDoX, "onNext"> & { getProgress: () => Promise<FlowProgress> }) => {
  const [progress, setProgress] = useState<Pick<FlowProgress, "nextNodeState">>(
    {
      nextNodeState: "locked",
    }
  );
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    getProgress()
      .then((p) => setProgress(p))
      .then(() => setTimeout(refresh, 5000))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    setTimeout(refresh, 5000);
  }, [getProgress]);

  return (
    <Shell>
      <ShellHeader>Flow</ShellHeader>
      <ShellContent>Wait until the next node is unlocked.</ShellContent>
      <ShellFooter>
        <Box flex="2">
          <ButtonPrimary
            disabled={progress.nextNodeState === "locked"}
            onClick={onNext}
          >
            Next
          </ButtonPrimary>
        </Box>
        <Box flex="1">
          <ButtonSecondary
            tone="accent"
            disabled={refreshing}
            onClick={refresh}
          >
            Refresh
          </ButtonSecondary>
        </Box>
      </ShellFooter>
    </Shell>
  );
};
