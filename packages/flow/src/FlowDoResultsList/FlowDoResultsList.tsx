import { TaskResult } from "@bitflow/base";
import { useDate } from "@bitflow/date";
import { css } from "@emotion/react";
import { Box, Text, Theme } from "@openpatch/patches";
import { TaskResultState } from "../FlowDoResults/TaskResultState";

export type FlowDoResultsListEntryProps = {
  session: string;
  states: Record<TaskResult["state"], number>;
  currentNode: {
    id: string;
    name: string;
  };
  avgTries: number;
  onClick: FlowDoResultsListProps["onClick"];
  startDate: Date | string;
  endDate?: Date | string;
};

export const FlowDoResultsListEntry = ({
  session,
  states,
  currentNode,
  avgTries,
  startDate,
  onClick,
  endDate,
}: FlowDoResultsListEntryProps) => {
  const { formatDistance, formatDistanceToNow } = useDate();
  let distance = formatDistanceToNow(new Date(startDate));
  if (endDate) {
    distance = formatDistance(new Date(startDate), new Date(endDate));
  }
  return (
    <Box
      py="small"
      display="flex"
      flexWrap="wrap"
      onClick={onClick ? () => onClick(session) : undefined}
      alignItems="center"
      justifyContent="center"
      css={(theme: Theme) => [
        css`
          border-top-width: 1px;
          border-top-color: ${theme.colors.neutral["100"]};
          border-top-style: solid;
        `,
        css`
          cursor: ${theme.cursor.pointer};
        `,
      ]}
    >
      <Box flex="4" px="standard">
        <Text>{session}</Text>
      </Box>
      <Box flex="2" px="standard">
        <TaskResultState {...states} />
      </Box>
      <Box flex="1" px="standard">
        <Text textAlign="right">{avgTries}</Text>
      </Box>
      <Box flex="1" px="standard">
        <Text textAlign="right">{currentNode.name}</Text>
      </Box>
      <Box flex="1" textAlign="right" px="standard">
        <Text>{distance}</Text>
      </Box>
    </Box>
  );
};

export type FlowDoResultsListProps = {
  results: FlowDoResultsListEntryProps[];
  onClick?: (sessionId: string) => void;
};

export const FlowDoResultsList = ({
  results,
  onClick,
}: FlowDoResultsListProps) => {
  return (
    <Box>
      <Box
        display="flex"
        backgroundColor="neutral.100"
        py="small"
        borderTopLeftRadius="standard"
        borderTopRightRadius="standard"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="center"
      >
        <Box flex="4" px="standard">
          <Text>Session ID</Text>
        </Box>
        <Box flex="2" textAlign="center" px="standard">
          Task Results
        </Box>
        <Box flex="1" px="standard">
          <Text textAlign="right">Avg. Tries</Text>
        </Box>
        <Box flex="1" px="standard">
          <Text textAlign="right">Current Node</Text>
        </Box>
        <Box flex="1" textAlign="right" px="standard">
          <Text>Duration</Text>
        </Box>
      </Box>

      <Box>
        {results.map((result) => (
          <FlowDoResultsListEntry
            key={result.session}
            onClick={onClick}
            {...result}
          />
        ))}
      </Box>
    </Box>
  );
};
