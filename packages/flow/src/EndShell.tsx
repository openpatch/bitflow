import { TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import { Shell, ShellContent, ShellHeader } from "@bitflow/shell";
import { AutoGrid, Box, Card, Icon, Markdown, Text } from "@openpatch/patches";
import {
  Asterisk,
  FastForward,
  Help,
  ThumbsDown,
  ThumbsUp,
} from "@openpatch/patches/dist/cjs/icons/shade";
import { useTranslations } from "@vocab/react";
import { useState } from "react";
import { FlowResultPathEntry } from "./FlowDo";
import translations from "./locales.vocab";
import { IEnd, IFlowNodePublic } from "./schemas";

const CorrectIcon = () => (
  <Icon color="success" size="large">
    <ThumbsUp />
  </Icon>
);

const WrongIcon = () => (
  <Icon color="error" size="large">
    <ThumbsDown />
  </Icon>
);

const SkippedIcon = () => (
  <Icon color="info" size="large">
    <FastForward />
  </Icon>
);

const ManualIcon = () => (
  <Icon color="warning" size="large">
    <Asterisk />
  </Icon>
);

const UnknownIcon = () => (
  <Icon color="neutral" size="large">
    <Help />
  </Icon>
);

type ResultCardProps = {
  result: FlowResultPathEntry[];
  onClick: ({
    node,
    result,
    answer,
  }: {
    node: IFlowNodePublic;
    result?: TaskResult;
    answer?: TaskAnswer;
  }) => void;
};

const ResultCard = ({ result, onClick }: ResultCardProps) => {
  if (!result?.[0].node) {
    return null;
  }
  const node = result[0].node;
  if (node.type !== "task") {
    return null;
  }

  return (
    <Card>
      <Text ml="small" mt="small" fontWeight="bold">
        {node.data.name}
      </Text>
      <Box display="flex" flexWrap="wrap" justifyContent="start">
        {result.map((r) => {
          let icon = null;
          let title = "";
          if (r.status === "skipped") {
            icon = <SkippedIcon />;
            title = "skipped";
          } else if (r.status === "finished") {
            if (r.result.state === "correct") {
              icon = <CorrectIcon />;
              title = "correct";
            } else if (r.result.state === "wrong") {
              icon = <WrongIcon />;
              title = "wrong";
            } else if (r.result.state === "manual") {
              icon = <ManualIcon />;
              title = "manual";
            } else if (r.result.state === "unknown") {
              icon = <UnknownIcon />;
              title = "unknown";
            }
          }
          if (!icon) {
            return null;
          } else {
            let answer: TaskAnswer | undefined = undefined;
            let result: TaskResult | undefined = undefined;
            if (r.status === "finished") {
              answer = r.answer;
              result = r.result;
            }
            return (
              <Box
                m="small"
                key={String(r.startDate)}
                title={title}
                cursor="pointer"
                onClick={() =>
                  onClick({
                    node: r.node,
                    answer,
                    result,
                  })
                }
              >
                {icon}
              </Box>
            );
          }
        })}
      </Box>
    </Card>
  );
};

export type EndShellProps = {
  end: IEnd;
  points?: number;
  maxPoints?: number;
  results?: FlowResultPathEntry[][];
};

export const EndShell = ({
  points,
  maxPoints,
  results = [],
  end,
}: EndShellProps) => {
  const { t } = useTranslations(translations);
  const [selectedResult, setSelectedResult] = useState<{
    node: IFlowNodePublic;
    result?: TaskResult;
    answer?: TaskAnswer;
  }>();

  if (selectedResult && selectedResult.node.type === "task") {
    const TaskComponent = taskBits[selectedResult.node.data.subtype].Task;
    return (
      <Shell>
        <ShellHeader onClose={() => setSelectedResult(undefined)}>
          {selectedResult.node.data.name}
        </ShellHeader>
        <ShellContent>
          <TaskComponent
            mode="result"
            answer={selectedResult.answer}
            result={selectedResult.result}
            task={selectedResult.node.data}
          />
        </ShellContent>
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader>{t("end")}</ShellHeader>
      <ShellContent>
        <Box padding="standard">
          <AutoGrid gap="standard">
            <Markdown markdown={end.view.markdown} />
            {points !== undefined && maxPoints !== undefined && (
              <Text
                textAlign="center"
                textColor="primary.600"
                fontSize="xxlarge"
              >
                {t("end-points", { points, maxPoints })}
              </Text>
            )}
            {results.map((r, i) => {
              return (
                <ResultCard key={i} result={r} onClick={setSelectedResult} />
              );
            })}
          </AutoGrid>
        </Box>
      </ShellContent>
    </Shell>
  );
};
