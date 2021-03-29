import { useEffect, useState } from "react";
import { FlowDoX, FlowProgress } from ".";
import { EndShell } from "../EndShell";

export const FlowDoEnd = ({
  getProgress,
  node,
}: Pick<FlowDoX, "getProgress" | "node"> & {
  node: { type: "end" };
}) => {
  const [progress, setProgress] = useState<Pick<FlowProgress, "points">>({
    points: 0,
  });

  useEffect(() => {
    if (getProgress) {
      getProgress().then((p) => setProgress(p));
    }
  }, []);

  return (
    <EndShell
      end={node.data}
      points={node.data.view.showPoints ? progress.points : undefined}
    />
  );
};
