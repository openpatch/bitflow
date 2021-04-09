import { useEffect, useState } from "react";
import { FlowDoX, FlowResult } from ".";
import { EndShell } from "../EndShell";

export const FlowDoEnd = ({
  getResult,
  node,
}: Pick<FlowDoX, "getResult" | "node"> & {
  node: { type: "end" };
}) => {
  const [result, setResult] = useState<Pick<FlowResult, "points">>({
    points: 0,
  });

  useEffect(() => {
    if (getResult) {
      getResult().then((p) => setResult(p));
    }
  }, []);

  return (
    <EndShell
      end={node.data}
      points={node.data.view.showPoints ? result.points : undefined}
    />
  );
};
