import { css } from "@emotion/react";
import {
  lerpColor,
  StatisticProps as StatisticPropsBase,
} from "@openpatch/bits-base";
import { AutoGrid, Box, Heading, Text } from "@openpatch/patches";
import { IEvaluation, IStatistic, ITask } from "./types";

export interface StatisticProps
  extends StatisticPropsBase<IStatistic, ITask, IEvaluation> {
  locales?: {
    patterns?: string;
  };
}

const defaultLocales: Required<StatisticProps["locales"]> = {
  patterns: "Patterns",
};

export const Statistic = ({ statistic, locales }: StatisticProps) => {
  const patterns = Object.keys(statistic.patterns)
    .map((c) => {
      const pattern = statistic.patterns[c];
      return {
        pattern: c,
        count: pattern?.count || 0,
      };
    })
    .sort((a, b) => (a.count > b.count ? -1 : 1));

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Heading as="h2">
          {locales?.patterns || defaultLocales.patterns}
        </Heading>
        {patterns.map((p, i) => (
          <Box
            display="flex"
            borderRadius="standard"
            css={css`
              background-color: ${lerpColor(
                "#84C5F4",
                "#DCEEFB",
                i / patterns.length
              )};
            `}
            padding="standard"
          >
            <Box flex="1" mr="standard">
              <Text>{p.pattern.toUpperCase().split("").join(" - ")}</Text>
            </Box>
            <Text fontWeight="bold">{p.count}</Text>
          </Box>
        ))}
      </AutoGrid>
    </Box>
  );
};
