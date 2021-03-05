import { Box, Markdown } from "@openpatch/patches";
import { InputProps } from "@openpatch/bits-base";
import { FC } from "react";
import { IInputMarkdown } from "./types";

export * from "./types";

export const InputMarkdown: FC<InputProps<IInputMarkdown>> = ({ input }) => {
  return (
    <Box px="standard">
      <Markdown markdown={input.markdown} />
    </Box>
  );
};
