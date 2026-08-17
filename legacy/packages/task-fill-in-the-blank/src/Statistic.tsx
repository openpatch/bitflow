import { lerpColor } from "@bitflow/core";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Icon, Text, Theme } from "@openpatch/patches";
import { Help } from "@openpatch/patches/icons";
import { useTranslations } from "@vocab/react";
import { createContext, useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import translations from "./locales.vocab";
import { IStatistic, TaskBit } from "./types";

const blanksContext = createContext<{
  select: (id: string) => void;
  blanks: IStatistic["blanks"];
}>({
  select: () => null,
  blanks: {},
});

const useBlank = (id: string) => {
  const { blanks } = useContext(blanksContext);

  const result = Object.entries(blanks[id]).map(([value, statistic]) => ({
    value,
    ...statistic,
  }));

  return {
    result,
  };
};

const useBlankMostFreqAnswer = (id: string) => {
  const { blanks, select } = useContext(blanksContext);

  const handleSelect = () => select(id);

  const mostFreqAnswer = Object.entries(blanks[id]).reduce((a, b) =>
    a[1].count > b[1].count ? a : b
  );

  return {
    select: handleSelect,
    result: {
      value: mostFreqAnswer[0],
      ...mostFreqAnswer[1],
    },
  };
};

const Blank = ({ node }: { node: any }) => {
  const id = node?.children?.[0]?.value;

  if (!id) {
    return <div>ERROR missing ID</div>;
  }

  const { result, select } = useBlankMostFreqAnswer(id);

  return (
    <button
      onClick={select}
      css={(theme: Theme) => [
        css`
          background-color: ${theme.colors.neutral["100"]};
          color: ${theme.colors.text};
          border-radius: ${theme.radii.small};
          border-style: solid;
          border-width: ${theme.borderWidths.light};
          border-color: ${theme.colors.neutral["300"]};
          cursor: pointer;
        `,
        result.correct &&
          css`
            background-color: ${theme.colors.primary["100"]};
          `,
      ]}
    >
      {result.value} {result.count}
    </button>
  );
};

type BlankStatisticProps = {
  id: string;
};

const BlankStatistic = ({ id }: BlankStatisticProps) => {
  const { t } = useTranslations(translations);
  const { result } = useBlank(id);

  return (
    <AutoGrid gap="standard">
      <Heading as="h3">{t("answers")}</Heading>
      {result
        .sort((a, b) => b.count - a.count)
        .map((p, i) => (
          <Box
            key={p.value}
            display="flex"
            borderRadius="standard"
            borderStyle="solid"
            borderWidth="light"
            css={(theme: Theme) => css`
              border-color: ${p.correct
                ? theme.colors.success["500"]
                : lerpColor("#84C5F4", "#DCEEFB", i / result.length)};
            `}
            padding="standard"
          >
            <Box flex="1" mr="standard">
              <Text>{p.value}</Text>
            </Box>
            <Text fontWeight="bold">{p.count}</Text>
          </Box>
        ))}
    </AutoGrid>
  );
};

const renderers = {
  del: Blank,
};

export const Statistic: TaskBit["Statistic"] = ({ statistic, task }) => {
  const [selectedBlank, setSelectedBlank] = useState<string>();
  const { t } = useTranslations(translations);
  return (
    <Box padding="standard">
      <Heading as="h2" title={t("statistic-most-frequent-answers-description")}>
        {t("statistic-most-frequent-answers")}
        <Icon size="small" color="info">
          <Help />
        </Icon>
      </Heading>
      <blanksContext.Provider
        value={{
          blanks: statistic.blanks,
          select: setSelectedBlank,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[gfm]}
          components={renderers}
          children={task.view.textWithBlanks}
        />
        {selectedBlank && <BlankStatistic id={selectedBlank} />}
      </blanksContext.Provider>
    </Box>
  );
};
