import { Box, Markdown } from "@openpatch/patches";
import { PrivacyProps } from "@openpatch/bits-base";
import { FC } from "react";
import { IPrivacyMarkdown } from "./types";

export * from "./types";

export const PrivacyMarkdown: FC<PrivacyProps<IPrivacyMarkdown>> = ({
  privacy,
}) => {
  return (
    <Box px="standard">
      <Markdown markdown={privacy.markdown} />
    </Box>
  );
};
