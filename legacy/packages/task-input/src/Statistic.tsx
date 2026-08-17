import { lerpColor } from "@bitflow/core";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Icon, Text, useTheme } from "@openpatch/patches";
import { Help } from "@openpatch/patches/icons"
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { TagCloud } from "react-tagcloud";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const Statistic: TaskBit["Statistic"] = ({ statistic }) => {
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
            <Heading as="h2" title={t("statistic-patterns-description")}>{t("patterns")} <Icon size="small" color="info"><Help /></Icon></Heading>
            {patterns.map((p, i) => (
              <Box
                display="flex"
                borderRadius="standard"
                borderWidth="light"
                borderStyle="solid"
                css={css`
                  border-color: ${lerpColor(
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
            <Heading as="h2" title={t("statistic-inputs-description")}>{t("inputs")} <Icon size="small" color="info"><Help /></Icon></Heading>
            <TagCloud
              tags={inputs}
              minSize={12}
              maxSize={35}
              shuffle={false}
              renderer={(tag, size, color) => {
                return (
                  <Box
                    key={tag.key || tag.value}
                    display="inline-block"
                    padding="xxsmall"
                    margin="xsmall"
                    title={`${tag.count}`}
                    borderRadius="small"
                    borderWidth="light"
                    css={css`
                      border-style: solid;
                      border-color: ${color};
                      color: ${color};
                      font-size: ${size}px;
                    `}
                  >
                    {tag.value}
                  </Box>
                );
              }}
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
