import {
  CorrectIcon,
  ManualIcon,
  UnknownIcon,
  WrongIcon,
} from "@bitflow/icons";
import { AutoGrid, Box, Text } from "@openpatch/patches";

export type TaskResultStateProps = Record<Bitflow.TaskResult["state"], number>;

export const TaskResultState = ({
  manual,
  correct,
  unknown,
  wrong,
}: TaskResultStateProps) => {
  return (
    <AutoGrid columns={4} gap="small">
      <Box display="flex" flexDirection="column" alignItems="center">
        <CorrectIcon size="small" />
        <Text>{correct}</Text>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <WrongIcon size="small" />
        <Text>{wrong}</Text>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <ManualIcon size="small" />
        <Text>{manual}</Text>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <UnknownIcon size="small" />
        <Text>{unknown}</Text>
      </Box>
    </AutoGrid>
  );
};
