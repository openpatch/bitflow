import { FlowModel } from "@bitflow/flow";
import { round } from "@bitflow/stats";
import { runAuth } from "@middlewares/auth";
import { Box, Card, CardContent } from "@openpatch/patches";
import { Activity } from "@schemas/activity";
import { ActivityReport } from "@schemas/activityReport";
import { ReportLayout, ReportLayoutProps } from "components/ReportLayout";
import { useActivity } from "hooks/activity";
import { useActivityReport } from "hooks/activityReport";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const isTask = (
  v: Activity["flow"]["nodes"][0]
): v is Activity["flow"]["nodes"][0] & { type: "task" } =>
  v.type === "task" && v.data.evaluation.mode !== "skip";

export default function ConceptsReport() {
  const router = useRouter();
  const id = router.query.id as string;
  const [mode, setMode] = useState<ReportLayoutProps["mode"]>("first");
  const [activity] = useActivity(id);
  const [report] = useActivityReport(id);
  const [tryReport, setTryReport] =
    useState<ActivityReport["tries"]["first"]>();

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
  }, [report, mode]);

  const sessionScores = Object.entries(tryReport?.overall.rawScores || {})
    .sort(([, ap], [, bp]) => bp - ap)
    .map(([session]) => session);
  const border = Math.floor(sessionScores.length * 0.25);
  const upper25Scores = sessionScores.slice(0, border);
  const lower25Scores = sessionScores.slice(sessionScores.length - border);
  const middleScores = sessionScores.slice(
    border,
    sessionScores.length - border
  );

  return (
    <ReportLayout
      active="concepts"
      mode={mode}
      onModeChange={handleModeChange}
      activity={{ id, name: activity?.name }}
      report={report}
    >
      <Card>
        <Box height="600px">
          {activity && (
            <FlowModel
              edges={activity?.model.edges || []}
              latentVariables={
                activity?.model.latentVariables.map((lv) => ({
                  ...lv,
                  data: {
                    ...lv.data,
                    alpha: tryReport?.model.latentVariables[lv.id]?.alpha,
                    mean: tryReport?.model.latentVariables[lv.id]?.mean,
                  },
                })) as any
              }
              nodes={
                (activity?.flow.nodes.filter(isTask).map((n) => ({
                  ...n,
                  type: "manifest-task",
                  position: activity.model.nodes[n.id].position || n.position,
                })) as any) || []
              }
            />
          )}
        </Box>
      </Card>
      <Card>
        <CardContent>
          <Chart
            type="radar"
            options={{
              labels:
                activity?.model.latentVariables.map((lv) => lv.data.title) ||
                [],
              yaxis: {
                max: 100,
                min: 0,
                tickAmount: 4,
              },
              dataLabels: {
                enabled: true,
              },
              legend: {
                show: true,
              },
            }}
            height="400px"
            series={[
              {
                name: "Upper 25%",
                data: Object.values(tryReport?.model.latentVariables || []).map(
                  (lv) => {
                    const mean =
                      Object.entries(lv.rawScores)
                        .filter(([session]) => upper25Scores.includes(session))
                        .reduce((acc, [, p]) => p + acc, 0) /
                      upper25Scores.length;
                    return round((mean / lv.max) * 100, 0) || 0;
                  }
                ),
              },
              {
                name: "Lower 25%",
                data: Object.values(tryReport?.model.latentVariables || []).map(
                  (lv) => {
                    const mean =
                      Object.entries(lv.rawScores)
                        .filter(([session]) => lower25Scores.includes(session))
                        .reduce((acc, [, p]) => p + acc, 0) /
                      lower25Scores.length;
                    return round((mean / lv.max) * 100, 0) || 0;
                  }
                ),
              },
              {
                name: "Middle 50%",
                data: Object.values(tryReport?.model.latentVariables || []).map(
                  (lv) => {
                    const mean =
                      Object.entries(lv.rawScores)
                        .filter(([session]) => middleScores.includes(session))
                        .reduce((acc, [, p]) => p + acc, 0) /
                      middleScores.length;
                    return round((mean / lv.max) * 100, 0) || 0;
                  }
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
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
