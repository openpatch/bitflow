import { taskBits } from "@bitflow/bits";
import { FlowDoResultPathEntry } from "@bitflow/flow";
import { round } from "@bitflow/stats";
import { css } from "@emotion/react";
import {
  AutoGrid,
  Box,
  Card,
  CardContent,
  CardFooter,
  Icon,
  LoadingDots,
  useTheme,
} from "@openpatch/patches";
import {
  Asterisk,
  FastForward,
  Help,
  Play,
  ThumbsDown,
  ThumbsUp,
} from "@openpatch/patches/dist/cjs/icons/shade";
import { Activity } from "@schemas/activity";
import { ActivityReport } from "@schemas/activityReport";
import { CorrectIcon } from "components/CorrectIcon";
import { ManualIcon } from "components/ManualIcon";
import { ReportLayout, ReportLayoutProps } from "components/ReportLayout";
import { SkippedIcon } from "components/SkippedIcon";
import { StartedIcon } from "components/StartedIcon";
import { UnknownIcon } from "components/UnknownIcon";
import { WrongIcon } from "components/WrongIcon";
import { useActivity } from "hooks/activity";
import { useActivityReport } from "hooks/activityReport";
import { useActivitySessionPathForNode } from "hooks/activitySessionPath";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { AutoSizer, MultiGrid } from "react-virtualized";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const isTask = (
  v: Activity["flow"]["nodes"][0]
): v is Activity["flow"]["nodes"][0] & { type: "task" } =>
  v.type === "task" && v.data.evaluation.mode !== "skip";

const PersonTaskIcon = ({
  status,
  state,
  active = false,
  mode = "icons",
  points = 0,
  onClick = () => {},
}: {
  status?: FlowDoResultPathEntry["status"];
  state?: ActivityReport["tries"]["first"]["tasks"]["1"]["rawStates"]["1"]["state"];
  active?: boolean;
  points?: number;

  mode?: "points" | "icons";
  onClick?: () => void;
}) => {
  let icon: ReactNode;
  if (status === "started") {
    icon = (
      <Icon color="neutral" size="large">
        <Play />
      </Icon>
    );
  } else if (status === "skipped") {
    icon = (
      <Icon color="info" size="large">
        <FastForward />
      </Icon>
    );
  } else if (state === "correct") {
    if (mode === "icons") {
      icon = (
        <Icon color="success" size="large">
          <ThumbsUp />
        </Icon>
      );
    } else {
      icon = (
        <Box
          as="span"
          borderRadius="full"
          width="48px"
          height="48px"
          backgroundColor="success.100"
          display="flex"
          justifyContent="center"
          alignItems="center"
          textColor="success.900"
        >
          {round(points, 2)}
        </Box>
      );
    }
  } else if (state === "wrong") {
    icon = (
      <Icon color="error" size="large">
        <ThumbsDown />
      </Icon>
    );
  } else if (state === "manual") {
    icon = (
      <Icon color="warning" size="large">
        <Asterisk />
      </Icon>
    );
  } else if (state === "unknown") {
    icon = (
      <Icon color="accent" size="large">
        <Help />
      </Icon>
    );
  }

  return (
    <Box
      onClick={onClick}
      css={(theme) => [
        active &&
          css`
            & > span {
              border-width: 6px;
              border-style: solid;
              border-color: ${theme.colors.accent["200"]};
            }
          `,
      ]}
      cursor={status === "finished" ? "pointer" : undefined}
      width="auto"
      display="inline"
    >
      {icon}
    </Box>
  );
};

export default function PersonsReport() {
  const router = useRouter();
  const [theme] = useTheme();
  const id = router.query.id as string;
  const [mode, setMode] = useState<ReportLayoutProps["mode"]>("first");
  const [activity] = useActivity(id);
  const [report] = useActivityReport(id);
  const [selectedTask, setSelectedTask] =
    useState<{ session: string; task: string }>();
  const selectedTaskNode = activity?.flow.nodes
    .filter(isTask)
    .find((t) => t.id === selectedTask?.task);
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const Task = taskBits[selectedTaskNode?.data.subtype || "choice"].Task;
  const [pathForNode] = useActivitySessionPathForNode(
    selectedTask?.session,
    selectedTask?.task,
    mode
  );
  const [tryReport, setTryReport] =
    useState<ActivityReport["tries"]["first"]>();

  const handleModeChange = (value: ReportLayoutProps["mode"]) => {
    router.push({ query: { mode: value, id, ...selectedTask } });
  };
  const handleSelectedTask = (task: string | null, session: string) => {
    router.push({ query: { task, session, id, mode } }, undefined, {
      scroll: false,
    });
  };

  useEffect(() => {
    const mode = router.query.mode;
    if (mode === "first" || mode === "last" || mode === "partial") {
      setMode(mode);
    }
    const task = router.query.task;
    const session = router.query.session;
    if (typeof task === "string" && typeof session === "string") {
      setSelectedTask({ task, session });
    }
  }, [router.query]);

  useEffect(() => {
    const tryReport = report?.tries?.[mode];
    setTryReport(tryReport);
  }, [report, mode]);

  const tasks =
    activity?.flow.nodes
      .filter(isTask)
      .sort(
        (t1, t2) =>
          (tryReport?.tasks[t2.id].n || 0) - (tryReport?.tasks[t1.id].n || 0)
      ) || [];
  let sessions = Object.keys(tryReport?.overall.rawScores || {});
  if (!sortColumn) {
    sessions = sessions.sort((a, b) =>
      sortDirection === "asc" ? a.localeCompare(b) * 1 : a.localeCompare(b) * -1
    );
  } else if (sortColumn === "points") {
    sessions = sessions.sort((a, b) => {
      const ap = tryReport?.overall.rawScores[a] || 0;
      const bp = tryReport?.overall.rawScores[b] || 0;
      return sortDirection === "asc" ? ap - bp : bp - ap;
    });
  }
  const points = new Array(tasks.length).fill(0);

  Object.values(tryReport?.overall.rawScores || {}).forEach((s) => {
    const bucket = Math.floor(s);
    points[bucket] += 1;
  });

  return (
    <ReportLayout
      active="persons"
      mode={mode}
      onModeChange={handleModeChange}
      activity={{ id, name: activity?.name }}
      report={report}
    >
      <Card>
        <CardContent>
          <Box height="350px">
            {tryReport && points.length > 0 ? (
              <Chart
                series={[
                  {
                    name: "Number of Persons",
                    data: points,
                  },
                ]}
                options={{
                  chart: {
                    toolbar: {
                      tools: {
                        download: true,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: false,
                      },
                    },
                  },
                  annotations: {
                    xaxis: [
                      {
                        x:
                          tryReport.overall.mean -
                          tryReport.overall.standardDeviation / 2,
                        x2:
                          tryReport.overall.mean +
                          tryReport.overall.standardDeviation / 2,
                        fillColor: "#B3F7CA",
                        label: {
                          borderColor: "#00E396",
                          orientation: "vertical",
                          text: `Standard Deviation ${round(
                            tryReport.overall.standardDeviation
                          )}`,
                        },
                      },
                      {
                        x: tryReport.overall.median,
                        borderColor: "#00E396",
                        label: {
                          borderColor: "#00E396",
                          orientation: "horizontal",
                          text: `Median ${round(tryReport.overall.median)}`,
                        },
                      },
                      {
                        x: tryReport.overall.mean,
                        borderColor: "#00E396",
                        label: {
                          borderColor: "#00E396",
                          orientation: "horizontal",
                          text: `Mean ${round(tryReport.overall.mean)}`,
                        },
                      },
                      {
                        x: tryReport.overall.rawScores[
                          selectedTask?.session || ""
                        ],
                        borderColor: theme.colors.accent["500"],
                        label: {
                          borderColor: theme.colors.accent["500"],
                          orientation: "horizontal",
                          text: `Selected Person ${round(
                            tryReport.overall.rawScores[
                              selectedTask?.session || ""
                            ]
                          )}`,
                        },
                      },
                    ],
                  },
                  yaxis: {
                    title: { text: "#Persons" },
                  },
                  xaxis: {
                    title: { text: "Points" },
                    max: tasks.length,
                    min: 0,
                    tickAmount: tasks.length,
                    type: "numeric",
                  },
                }}
                height="350px"
                type="bar"
              />
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="350px"
              >
                <LoadingDots size="large" />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      <Card>
        <Box>
          <AutoSizer disableHeight>
            {({ width }) => (
              <MultiGrid
                cellRenderer={({ columnIndex, key, rowIndex, style }) => {
                  const session = sessions[rowIndex - 1];
                  const task = tasks[columnIndex - 2];

                  if (rowIndex === 0) {
                    return (
                      <div
                        style={style}
                        key={key}
                        css={(theme) => css`
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          background-color: ${theme.colors.neutral["100"]};
                        `}
                      >
                        <div
                          css={css`
                            text-align: center;
                            margin: 0 4px;
                          `}
                        >
                          {columnIndex === 1 ? "Points" : task?.data.name}
                        </div>
                      </div>
                    );
                  }
                  if (columnIndex === 0) {
                    if (rowIndex > 0) {
                      return (
                        <div
                          key={key}
                          style={style}
                          onClick={() => handleSelectedTask(null, session)}
                          title={`Session ID: ${session}`}
                          css={(theme) => [
                            css`
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              cursor: pointer;
                              border-right-style: solid;
                              border-right-color: ${theme.colors.neutral[
                                "200"
                              ]};
                              border-right-width: 2px;
                              box-sizing: border-box;
                              background-color: ${rowIndex % 2 === 0
                                ? theme.colors.neutral["50"]
                                : undefined};
                            `,
                            selectedTask?.session === session &&
                              css`
                                font-weight: bold;
                              `,
                          ]}
                        >
                          {report?.usernames[session] || session}
                        </div>
                      );
                    }
                  } else if (columnIndex === 1) {
                    if (rowIndex > 0) {
                      return (
                        <div
                          key={key}
                          style={style}
                          css={(theme) => css`
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            border-right-style: solid;
                            border-right-color: ${theme.colors.neutral["200"]};
                            border-right-width: 2px;
                            box-sizing: border-box;
                            background-color: ${rowIndex % 2 === 0
                              ? theme.colors.neutral["50"]
                              : undefined};
                          `}
                        >
                          {round(tryReport?.overall.rawScores[session], 2)}
                        </div>
                      );
                    }
                  }

                  const status =
                    tryReport?.nodes[task.id]?.rawStatus[session]?.status;
                  return (
                    <div
                      key={key}
                      style={style}
                      css={(theme) => css`
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: ${rowIndex % 2 === 0
                          ? theme.colors.neutral["50"]
                          : undefined};
                      `}
                    >
                      <PersonTaskIcon
                        active={
                          session === selectedTask?.session &&
                          task.id === selectedTask?.task
                        }
                        onClick={
                          status === "finished"
                            ? () => handleSelectedTask(task.id, session)
                            : undefined
                        }
                        state={
                          tryReport?.tasks[task.id]?.rawStates[session]?.state
                        }
                        points={tryReport?.tasks[task.id]?.rawScores[session]}
                        mode={mode === "partial" ? "points" : "icons"}
                        status={status}
                      />
                    </div>
                  );
                }}
                styleTopRightGrid={{
                  backgroundColor: theme.colors.neutral["100"],
                }}
                fixedColumnCount={2}
                fixedRowCount={1}
                columnWidth={(i) => (i.index === 0 ? 320 : 120)}
                columnCount={tasks.length + 2}
                hideTopRightGridScrollbar
                hideBottomLeftGridScrollbar
                enableFixedRowScroll
                enableFixedColumnScroll
                height={120 + 80 * 10}
                rowHeight={(i) => (i.index === 0 ? 120 : 80)}
                rowCount={sessions.length + 1}
                width={width}
              />
            )}
          </AutoSizer>
        </Box>
        <CardFooter>
          <StartedIcon size="auto" /> Started <SkippedIcon size="auto" />
          Skipped <ManualIcon size="auto" /> Manual <UnknownIcon size="auto" />
          Unknown <CorrectIcon size="auto" /> Correct <WrongIcon size="auto" />{" "}
          Wrong
        </CardFooter>
      </Card>
      <AutoGrid gap="standard">
        {selectedTaskNode ? (
          <Card>
            {pathForNode ? (
              <Task
                task={selectedTaskNode.data}
                answer={pathForNode.answer}
                result={pathForNode.result}
                mode="result"
              />
            ) : (
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="center">
                  <LoadingDots size="large" />
                </Box>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                fontSize="large"
                height="200px"
              >
                Click on
                <Box mx="xxsmall">
                  <CorrectIcon size="large" />
                </Box>{" "}
                or
                <Box mx="xxsmall">
                  <WrongIcon size="large" />
                </Box>{" "}
                to show an answer
              </Box>
            </CardContent>
          </Card>
        )}
      </AutoGrid>
    </ReportLayout>
  );
}
