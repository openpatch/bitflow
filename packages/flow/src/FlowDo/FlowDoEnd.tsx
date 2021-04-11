import { groupBy } from "@bitflow/base";
import { useEffect, useState } from "react";
import { FlowDoX } from ".";
import { EndShell, EndShellProps } from "../EndShell";

export const FlowDoEnd = ({
  getResult,
  node,
}: Pick<FlowDoX, "getResult" | "node"> & {
  node: { type: "end" };
}) => {
  const [result, setResult] = useState<{
    points: EndShellProps["points"];
    results: EndShellProps["results"];
    maxPoints: EndShellProps["maxPoints"];
  }>({
    points: 0,
    maxPoints: 0,
    results: [],
  });

  useEffect(() => {
    if (getResult) {
      getResult().then((r) => {
        const results = groupBy(r.path, (p) => p.node.id);

        setResult({
          results,
          maxPoints: r.maxPoints,
          points: r.points,
        });
      });
    }
  }, []);

  return (
    <EndShell
      end={node.data}
      points={node.data.view.showPoints ? result.points : undefined}
      maxPoints={node.data.view.showPoints ? result.maxPoints : undefined}
      results={node.data.view.listResults ? result.results : undefined}
    />
  );
};
