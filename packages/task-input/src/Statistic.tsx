import { lerpColor, TaskStatisticProps } from "@bitflow/base";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Text, useTheme } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { TagCloud } from "react-tagcloud";
import translations from "./locales.vocab";
import { ITask } from "./schemas";
import { IStatistic } from "./types";

export const Statistic = ({
  statistic,
}: TaskStatisticProps<IStatistic, ITask>) => {
  const { t } = useTranslations(translations);
  const [theme] = useTheme();
  const patterns = Object.keys(statistic.patterns)
    .map((c) => {
      const pattern = statistic.patterns[c];
      return {
        pattern: c,
        count: pattern?.count || 0,
      };
    })
    .sort((a, b) => (a.count > b.count ? -1 : 1));

  const inputs = Object.keys(statistic.inputs).map((c) => {
    const input = statistic.inputs[c];
    return {
      value: c,
      count: input?.count || 0,
      color: input.correct ? theme.colors.success["500"] : undefined,
    };
  });

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        {patterns.length > 0 && (
          <Fragment>
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
          </Fragment>
        )}
        {inputs.length > 0 && (
          <Fragment>
            <Heading as="h2">{t("inputs")}</Heading>
            <TagCloud
              tags={inputs}
              minSize={12}
              maxSize={35}
              colorOptions={{
                luminosity: "dark",
                hue: theme.colors.warning["500"],
              }}
            />
          </Fragment>
        )}
      </AutoGrid>
    </Box>
  );
};
