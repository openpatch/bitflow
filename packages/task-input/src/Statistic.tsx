import { lerpColor, TaskStatisticProps } from "@bitflow/base";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Text } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { ITask } from "./schemas";
import { IStatistic } from "./types";

export const Statistic = ({
  statistic,
}: TaskStatisticProps<IStatistic, ITask>) => {
  const { t } = useTranslations(translations);
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
        <Heading as="h2">{t("patterns")}</Heading>
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
              <Text>{p.pattern}</Text>
            </Box>
            <Text fontWeight="bold">{p.count}</Text>
          </Box>
        ))}
      </AutoGrid>
    </Box>
  );
};
