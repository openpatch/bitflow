import { lerpColor, TaskStatisticProps } from "@bitflow/base";
import { css } from "@emotion/react";
import { AutoGrid, Box, Heading, Text } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { createContext, useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import translations from "./locales.vocab";
import { ITask } from "./schemas";
import { IStatistic } from "./types";

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
      css={[
        css``,
        result.correct &&
          css`
            background-color: "#d6ffd6";
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
      <Heading as="h2">{t("answers")}</Heading>
      {result.map((p, i) => (
        <Box
          display="flex"
          borderRadius="standard"
          css={css`
            background-color: ${p.correct
              ? "#d6ffd6"
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
  delete: Blank,
};

export const Statistic = ({
  statistic,
  task,
}: TaskStatisticProps<IStatistic, ITask>) => {
  const [selectedBlank, setSelectedBlank] = useState<string>();
  return (
    <Box padding="standard">
      <blanksContext.Provider
        value={{
          blanks: statistic.blanks,
          select: setSelectedBlank,
        }}
      >
        <ReactMarkdown
          plugins={[gfm]}
          renderers={renderers}
          children={task.view.textWithBlanks}
        />
        {selectedBlank && <BlankStatistic id={selectedBlank} />}
      </blanksContext.Provider>
    </Box>
  );
};
