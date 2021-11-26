import { lerpColor } from "@bitflow/core";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Icon, Text, Theme } from "@openpatch/patches";
import { Help } from "@openpatch/patches/icons";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { TaskBit } from "./types";
import { options } from "./schemas";

export const Statistic: TaskBit["Statistic"] = ({ statistic, task }) => {
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

  const getTitleForPattern = (p: string): string => {
    return p
      .split("")
      .map((p) => {
        console.log();
        const i = options.indexOf(p as any);
        if (i > -1) {
          return `${p.toUpperCase()}: ${task.view.choices[i].markdown}`;
        }
        return "";
      })
      .join("\n");
  };

  return (
    <Box padding="standard">
      <AutoGrid gap="standard">
        <Heading as="h2" title={t("statistic-patterns-description")}>
          {t("patterns")}
          <Icon size="small" color="info">
            <Help />
          </Icon>
        </Heading>
        {patterns.map((p, i) => (
          <Box
            key={p.pattern}
            display="flex"
            borderRadius="standard"
            borderStyle="solid"
            borderWidth="light"
            css={(theme: Theme) => css`
              border-color: ${p.correct
                ? theme.colors.success["500"]
                : lerpColor("#84C5F4", "#DCEEFB", i / patterns.length)};
            `}
            padding="standard"
          >
            <Box
              css={css`
                cursor: help;
              `}
              flex="1"
              mr="standard"
            >
              <Text title={getTitleForPattern(p.pattern)}>
                {p.pattern.toUpperCase().split("").join(" - ")}
              </Text>
            </Box>
            <Text fontWeight="bold">{p.count}</Text>
          </Box>
        ))}
      </AutoGrid>
    </Box>
  );
};
