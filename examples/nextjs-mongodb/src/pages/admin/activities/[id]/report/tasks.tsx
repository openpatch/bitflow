import { taskBits } from "@bitflow/bits";
import { useDate } from "@bitflow/date";
import { round } from "@bitflow/stats";
import { css } from "@emotion/react";
import {
  AutoGrid,
  Box,
  Card,
  CardContent,
  CardFooter,
  useTheme,
} from "@openpatch/patches";
import { Activity } from "@schemas/activity";
import { ActivityReport } from "@schemas/activityReport";
import { CorrectIcon } from "components/CorrectIcon";
import { FinishedIcon } from "components/FinishedIcon";
import { ManualIcon } from "components/ManualIcon";
import { ReportLayout, ReportLayoutProps } from "components/ReportLayout";
import { SkippedIcon } from "components/SkippedIcon";
import { StartedIcon } from "components/StartedIcon";
import { UnknownIcon } from "components/UnknownIcon";
import { WrongIcon } from "components/WrongIcon";
import { addSeconds } from "date-fns";
import { useActivity } from "hooks/activity";
import { useActivityReport } from "hooks/activityReport";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { AutoSizer, MultiGrid } from "react-virtualized";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const isTask = (
  v: Activity["flow"]["nodes"][0]
): v is Activity["flow"]["nodes"][0] & { type: "task" } =>
  v.type === "task" && v.data.evaluation.mode !== "skip";

export default function TasksReport() {
  const router = useRouter();
  const [theme] = useTheme();
  const id = router.query.id as string;
  const { format } = useDate();
  const [mode, setMode] = useState<ReportLayoutProps["mode"]>("first");
  const [activity] = useActivity(id);
  const [report] = useActivityReport(id);
  const [selectedTask, setSelectedTask] = useState<string>();
  const selectedTaskNode = activity?.flow.nodes
    .filter(isTask)
    .find((t) => t.id === selectedTask);
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const TaskStatistic =
    taskBits[selectedTaskNode?.data.subtype || "choice"].Statistic;
  const Task = taskBits[selectedTaskNode?.data.subtype || "choice"].Task;
  const [tryReport, setTryReport] =
    useState<ActivityReport["tries"]["first"]>();

  const handleModeChange = (value: ReportLayoutProps["mode"]) => {
    router.push({ query: { mode: value, id, task: selectedTask } });
  };
  const handleSelectedTask = (task: string) => {
    router.push({ query: { task, id, mode } }, undefined, {
      scroll: false,
    });
  };

  useEffect(() => {
    const mode = router.query.mode;
    if (mode === "first" || mode === "last" || mode === "partial") {
      setMode(mode);
    }
    const task = router.query.task;
    if (typeof task === "string") {
      setSelectedTask(task);
    }
  }, [router.query]);

  useEffect(() => {
    const tryReport = report?.tries?.[mode];
    setTryReport(tryReport);
  }, [report, mode]);

  const tasks = activity?.flow.nodes.filter(isTask) || [];
  const columns = [
    { key: "n", label: "n" },
    { key: "status", label: "Status" },
    { key: "states", label: "States" },
    { key: "time", label: "Avg. Time" },
    { key: "tries", label: "Avg. Tries" },
    { key: "mean", label: "Avg. Points" },
    { key: "difficulty", label: "Difficulty" },
    { key: "discriminationIndex", label: "Discrimination Index" },
    { key: "standardDeviation", label: "Standard Deviation" },
  ] as const;

  return (
    <ReportLayout
      active="tasks"
      mode={mode}
      onModeChange={handleModeChange}
      activity={{ id, name: activity?.name }}
      report={report}
    >
      <Card>
        <Box>
          <AutoSizer disableHeight>
            {({ width }) => (
              <MultiGrid
                fixedColumnCount={1}
                cellRenderer={({ columnIndex, key, rowIndex, style }) => {
                  const task = tasks[rowIndex - 1];
                  const taskReport = tryReport?.tasks[task?.id || ""];
                  const nodeReport = tryReport?.nodes[task?.id || ""];
                  const tries = Object.values(
                    nodeReport?.rawStatus || {}
                  ).reduce((acc, s) => s.tries + acc, 0);
                  const tried = Object.values(
                    nodeReport?.rawStatus || {}
                  ).length;

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
                          {columns[columnIndex - 1]?.label}
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
                          onClick={() => handleSelectedTask(task.id)}
                          css={(theme) => [
                            css`
                              display: flex;
                              cursor: pointer;
                              justify-content: start;
                              padding-left: 8px;
                              align-items: center;
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
                            selectedTask === task.id &&
                              css`
                                font-weight: bold;
                              `,
                          ]}
                        >
                          {task.data.name}
                        </div>
                      );
                    }
                  }

                  let cell: ReactNode;
                  const column = columns[columnIndex - 1];
                  if (!taskReport || !nodeReport) {
                    return (
                      <div
                        style={style}
                        key={key}
                        css={(theme) => css`
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          background-color: ${rowIndex % 2 === 0
                            ? theme.colors.neutral["50"]
                            : undefined};
                        `}
                      />
                    );
                  }
                  switch (column.key) {
                    case "n": {
                      cell = taskReport.n;
                      break;
                    }
                    case "difficulty": {
                      cell = round((taskReport.difficulty || 0) * 100) + "%";
                      break;
                    }
                    case "discriminationIndex": {
                      cell = round(taskReport.discriminationIndex);
                      break;
                    }
                    case "mean": {
                      cell = round(taskReport.mean);
                      break;
                    }
                    case "standardDeviation": {
                      cell = round(taskReport.standardDeviation);
                      break;
                    }
                    case "time": {
                      const a = nodeReport.time / tried;
                      const date = addSeconds(new Date(0), a);
                      cell = format(date, "mm:ss") + "min";
                      break;
                    }
                    case "tries": {
                      cell = round(tries / tried);
                      break;
                    }
                    case "status": {
                      cell = (
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                          {nodeReport.status.started > 0 && (
                            <Box
                              display="flex"
                              alignItems="center"
                              mr="xxsmall"
                            >
                              {nodeReport?.status.started}
                              <StartedIcon size="auto" />
                            </Box>
                          )}
                          {nodeReport.status.skipped > 0 && (
                            <Box
                              display="flex"
                              alignItems="center"
                              mr="xxsmall"
                            >
                              {nodeReport?.status.skipped}
                              <SkippedIcon size="auto" />
                            </Box>
                          )}
                          {nodeReport.status.finished > 0 && (
                            <Box display="flex" alignItems="center">
                              {nodeReport?.status.finished}
                              <FinishedIcon size="auto" />
                            </Box>
                          )}
                        </Box>
                      );
                      break;
                    }
                    case "states": {
                      cell = (
                        <Box>
                          <Box
                            display="flex"
                            flexWrap="wrap"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            {taskReport.states.correct > 0 && (
                              <Box
                                display="flex"
                                alignItems="center"
                                mr="xxsmall"
                              >
                                {taskReport?.states.correct}
                                <CorrectIcon size="auto" />
                              </Box>
                            )}
                            {taskReport.states.wrong > 0 && (
                              <Box
                                display="flex"
                                alignItems="center"
                                mr="xxsmall"
                              >
                                {taskReport?.states.wrong}
                                <WrongIcon size="auto" />
                              </Box>
                            )}
                          </Box>
                          <Box
                            display="flex"
                            flexWrap="wrap"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            {taskReport.states.manual > 0 && (
                              <Box
                                display="flex"
                                alignItems="center"
                                mr="xxsmall"
                              >
                                {taskReport?.states.manual}
                                <ManualIcon size="auto" />
                              </Box>
                            )}
                            {taskReport.states.unknown > 0 && (
                              <Box display="flex" alignItems="center">
                                {taskReport?.states.unknown}
                                <UnknownIcon size="auto" />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                      break;
                    }
                  }

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
                      {cell}
                    </div>
                  );
                }}
                fixedRowCount={1}
                columnWidth={(i) =>
                  i.index === 0
                    ? 320
                    : Math.max(120, (width - 320) / columns.length)
                }
                columnCount={columns.length + 1}
                hideTopRightGridScrollbar
                hideBottomLeftGridScrollbar
                styleTopRightGrid={{
                  backgroundColor: theme.colors.neutral["100"],
                }}
                enableFixedRowScroll
                enableFixedColumnScroll
                height={120 + 80 * 10}
                rowHeight={(i) => (i.index === 0 ? 120 : 80)}
                rowCount={tasks.length + 1}
                width={width}
              />
            )}
          </AutoSizer>
        </Box>
        <CardFooter>
          <StartedIcon size="auto" /> Started <SkippedIcon size="auto" />
          Skipped <FinishedIcon size="auto" /> Finished{" "}
          <ManualIcon size="auto" /> Manual <UnknownIcon size="auto" />
          Unknown <CorrectIcon size="auto" /> Correct <WrongIcon size="auto" />{" "}
          Wrong
        </CardFooter>
      </Card>
      {selectedTaskNode ? (
        <AutoGrid gap="standard" columns={[1, 2]}>
          <Card>
            <Task task={selectedTaskNode.data} mode="result" />
          </Card>
          {tryReport?.tasks[selectedTaskNode.id]?.statistic ? (
            <Card>
              <TaskStatistic
                statistic={tryReport?.tasks[selectedTaskNode.id].statistic}
                task={selectedTaskNode.data}
              />
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  fontSize="large"
                  height="100%"
                >
                  Statistic when first answers come in
                </Box>
              </CardContent>
            </Card>
          )}
        </AutoGrid>
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
              Click on a task name to see more statistics
            </Box>
          </CardContent>
        </Card>
      )}
    </ReportLayout>
  );
}
