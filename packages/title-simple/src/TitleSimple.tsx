import { FC } from "react";
import { Title, TitleProps } from "@openpatch/bits-base";
import { Markdown, Box, Heading } from "@openpatch/patches";

export interface ITitleSimple extends Title {
  title: string;
  message: string;
}

export const TitleSimple: FC<TitleProps<ITitleSimple>> = ({ title }) => {
  return (
    <Box px="standard">
      <Heading as="h1" textAlign="center">
        {title.title}
      </Heading>
      <Markdown markdown={title.message}></Markdown>
    </Box>
  );
};
