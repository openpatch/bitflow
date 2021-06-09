import { TaskResult } from "@bitflow/base";
import { AutoGrid, Box, Icon, Text } from "@openpatch/patches";
import {
  Asterisk,
  Help,
  ThumbsDown,
  ThumbsUp,
} from "@openpatch/patches/dist/cjs/icons/shade";

export type TaskResultStateProps = Record<TaskResult["state"], number>;

export const TaskResultState = ({
  manual,
  correct,
  unknown,
  wrong,
}: TaskResultStateProps) => {
  return (
    <AutoGrid columns={4} gap="small">
      <Box display="flex" flexDirection="column" alignItems="center">
        <Icon color="success" size="small">
          <ThumbsUp />
        </Icon>
        <Text>{correct}</Text>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Icon color="error" size="small">
          <ThumbsDown />
        </Icon>
        <Text>{wrong}</Text>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Icon color="warning" size="small">
          <Asterisk />
        </Icon>
        <Text>{manual}</Text>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Icon color="neutral" size="small">
          <Help />
        </Icon>
        <Text>{unknown}</Text>
      </Box>
    </AutoGrid>
  );
};
