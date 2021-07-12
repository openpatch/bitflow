import { lerpColor } from "@bitflow/core";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Text } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const Statistic: TaskBit["Statistic"] = ({ statistic }) => {
  const { t } = useTranslations(translations);
  const patterns = Object.keys(statistic.patterns)
    .map((c) => {
      const pattern = statistic.patterns[c];
      return {
        pattern: c,
        count: pattern?.count || 0,
        correct: pattern?.correct || false,
      };
    })
    .sort((a, b) => (a.count > b.count ? -1 : 1));

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Heading as="h2">{t("patterns")}</Heading>
        {patterns.map((p, i) => (
          <Box
            key={p.pattern}
            display="flex"
            borderRadius="standard"
            css={css`
              background-color: ${p.correct
                ? "#d6ffd6"
                : lerpColor("#84C5F4", "#DCEEFB", i / patterns.length)};
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
