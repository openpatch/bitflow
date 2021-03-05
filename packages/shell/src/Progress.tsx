import { FC } from "react";
import { Box } from "@openpatch/patches";

export type ProgressProps = {
  value: number;
  max: number;
};

export const Progress: FC<ProgressProps> = ({ value = 0, max = 1 }) => {
  return (
    <Box height="5px" width="100%" backgroundColor="neutral.200">
      <Box
        backgroundColor="primary.800"
        height="100%"
        width={`${(value / max) * 100}%`}
      />
    </Box>
  );
};
