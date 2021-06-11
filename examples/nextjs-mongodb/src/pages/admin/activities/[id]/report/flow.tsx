import { useDate } from "@bitflow/date";
import { FlowDoResults, FlowDoResultsProps, FlowNode } from "@bitflow/flow";
import { round } from "@bitflow/stats";
import { css } from "@emotion/react";
import { runAuth } from "@middlewares/auth";
import {
  AutoGrid,
  Box,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@openpatch/patches";
import { ActivityReport } from "@schemas/activityReport";
import { Ranking } from "components/Ranking";
import { ReportLayout, ReportLayoutProps } from "components/ReportLayout";
import { addSeconds } from "date-fns";
import { useActivity } from "hooks/activity";
import { useActivityReport } from "hooks/activityReport";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const isTryTask = (
  v: FlowDoResultsProps["nodes"][0]
): v is FlowDoResultsProps["nodes"][0] & { type: "task" } =>
  v.type === "task" && v.data.evaluation.mode !== "skip";

export default function FlowReport() {
  const router = useRouter();
  const { format } = useDate();
  const id = router.query.id as string;
  const [mode, setMode] = useState<ReportLayoutProps["mode"]>("first");
  const [activity] = useActivity(id);
  const [report] = useActivityReport(id);
  const [tryReport, setTryReport] =
    useState<ActivityReport["tries"]["first"]>();
  const [edges, setEdges] = useState<FlowDoResultsProps["edges"]>([]);
  const [nodes, setNodes] = useState<FlowDoResultsProps["nodes"]>([]);

  const handleModeChange = (value: ReportLayoutProps["mode"]) => {
    router.push({ query: { mode: value, id } });
  };

  useEffect(() => {
    const mode = router.query.mode;
    if (mode === "first" || mode === "last" || mode === "partial") {
      setMode(mode);
    }
  }, [router.query]);

  useEffect(() => {
    const tryReport = report?.tries?.[mode];
    setTryReport(tryReport);

    const nodes: FlowDoResultsProps["nodes"] = [];

    if (activity && tryReport) {
      for (const node of activity?.flow.nodes) {
        const tryNode = tryReport.nodes[node.id];
        const tryTask = tryReport.tasks[node.id];

        const tries = Object.values(tryNode?.rawStatus || {}).reduce(
          (acc, s) => s.tries + acc,
          0
        );
        const tried = Object.values(tryNode?.rawStatus || {}).length;

        if (
          node.type === "task" ||
          node.type === "start" ||
          node.type === "end" ||
          node.type === "synchronize" ||
          node.type === "input" ||
          node.type === "title" ||
          node.type === "checkpoint"
        ) {
          nodes.push({
            ...node,
            data: {
              ...(node as any).data,
              result: {
                ...tryTask,
                count: tryNode?.n || 0,
                status: tryNode?.status || {},
                avgTries: tries / tried || 0,
                avgTime: tryNode?.time / tryNode?.n || 0,
              },
            } as any,
          });
        } else {
          nodes.push({ ...node } as any);
        }
      }

      setNodes(nodes);
      setEdges(activity.flow.edges as any);
    }
  }, [report, mode]);

  return (
    <ReportLayout
      active="flow"
      mode={mode}
      onModeChange={handleModeChange}
      activity={{
        id,
        name: activity?.name,
      }}
      report={report}
    >
      <Card>
        <Box height="600px">
          {nodes.length > 0 && <FlowDoResults edges={edges} nodes={nodes} />}
        </Box>
        <CardFooter>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
          >
            Difficulty
            <Box display="flex">
              <Box
                borderRadius="full"
                paddingX="xsmall"
                height="24px"
                css={css`
                  background-color: #f0fdf4;
                  color: #14532d;
                  border-color: #14532d;
                  border-style: solid;
                  border-width: 2px;
                `}
              >{`> 80%`}</Box>
              <Box
                borderRadius="full"
                paddingX="xsmall"
                height="24px"
                css={css`
                  background-color: #eaffea;
                  color: #3d663d;
                  border-color: #3d663d;
                  border-style: solid;
                  border-width: 2px;
                `}
              >{`> 60%`}</Box>
              <Box
                borderRadius="full"
                paddingX="xsmall"
                height="24px"
                css={css`
                  background-color: #fffaeb;
                  color: #513c06;
                  border-color: #513c06;
                  border-style: solid;
                  border-width: 2px;
                `}
              >{`> 30%`}</Box>
              <Box
                borderRadius="full"
                paddingX="xsmall"
                height="24px"
                css={css`
                  background-color: #ffeeee;
                  color: #620042;
                  border-color: #620042;
                  border-style: solid;
                  border-width: 2px;
                `}
              >{`<= 30%`}</Box>
            </Box>
          </Box>
          <FlowNode
            title="Name (Difficulty in %)"
            footerCenter="Started | Finished | Skipped"
          ></FlowNode>
        </CardFooter>
      </Card>
      <AutoGrid columns={[1, 2, 2]} gap="standard">
        <Card>
          <CardHeader>Lowest Difficulty (in %)</CardHeader>
          <CardContent>
            <Ranking
              limit={5}
              entries={nodes.filter(isTryTask).map((t) => ({
                label: t.data.name,
                value: t.data.result?.difficulty || 0,
              }))}
              sort="desc"
              compareFn={(a, b) => a - b}
              formatFn={(a) => round(a * 100)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Highest Difficulty (in %)</CardHeader>
          <CardContent>
            <Ranking
              limit={5}
              entries={nodes.filter(isTryTask).map((t) => ({
                label: t.data.name,
                value: t.data.result?.difficulty || 0,
              }))}
              sort="asc"
              compareFn={(a, b) => a - b}
              formatFn={(a) => round(a * 100)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Shortest Avg. Duration (in minutes)</CardHeader>
          <CardContent>
            <Ranking
              limit={5}
              entries={nodes.filter(isTryTask).map((t) => ({
                label: t.data.name,
                value: t.data.result?.avgTime || 0,
              }))}
              sort="asc"
              compareFn={(a, b) => a - b}
              formatFn={(a) => {
                const date = addSeconds(new Date(0), a);
                return format(date, "mm:ss");
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Longest Avg. Duration (in minutes)</CardHeader>
          <CardContent>
            <Ranking
              limit={5}
              entries={nodes.filter(isTryTask).map((t) => ({
                label: t.data.name,
                value: t.data.result?.avgTime || 0,
              }))}
              sort="desc"
              compareFn={(a, b) => a - b}
              formatFn={(a) => {
                const date = addSeconds(new Date(0), a);
                return format(date, "mm:ss");
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Least Avg. Tries</CardHeader>
          <CardContent>
            <Ranking
              limit={5}
              entries={nodes.filter(isTryTask).map((t) => ({
                label: t.data.name,
                value: t.data.result?.avgTries || 0,
              }))}
              sort="asc"
              compareFn={(a, b) => a - b}
              formatFn={(a) => round(a)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Most Avg. Tries</CardHeader>
          <CardContent>
            <Ranking
              limit={5}
              entries={nodes.filter(isTryTask).map((t) => ({
                label: t.data.name,
                value: t.data.result?.avgTries || 0,
              }))}
              sort="desc"
              compareFn={(a, b) => a - b}
              formatFn={(a) => round(a)}
            />
          </CardContent>
        </Card>
      </AutoGrid>
    </ReportLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const user = await runAuth(req, res);
  if (user === null) {
    return {
      redirect: {
        destination: "/admin/login?redirect=" + encodeURIComponent(resolvedUrl),
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
