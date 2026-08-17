import { DoTry } from "@bitflow/core";
import { AutoGrid, Box, Icon, Text } from "@openpatch/patches";
import {
  FastForward,
  Flag,
  Play,
  Refresh,
} from "@openpatch/patches/icons/shade";

export type InteractiveNodeStatusProps = Record<DoTry["status"], number> & {
  tries: number;
};

export const InteractiveNodeStatus = ({
  started,
  finished,
  skipped,
  tries,
}: InteractiveNodeStatusProps) => {
  let columns = 3;
  if (skipped > 0) {
    columns++;
  }
  return (
    <AutoGrid columns={columns} gap="small">
      <Box
        title="Started"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Icon color="warning" size="small">
          <Play />
        </Icon>
        <Text>{started}</Text>
      </Box>
      <Box
        title="Finished"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Icon color="success" size="small">
          <Flag />
        </Icon>
        <Text>{finished}</Text>
      </Box>
      {skipped > 0 && (
        <Box
          title="Skipped"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Icon color="info" size="small">
            <FastForward />
          </Icon>
          <Text>{skipped}</Text>
        </Box>
      )}
      <Box
        title="Average Tries"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Icon color="neutral" size="small">
          <Refresh />
        </Icon>
        <Text>{tries}</Text>
      </Box>
    </AutoGrid>
  );
};
