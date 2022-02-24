import { ButtonGroup, ButtonOutline, Box } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { IHighlightColor, TaskBit } from "./types";
import { colors, shadeColor } from "./colors";
import { useState } from "react";
import { css } from "@emotion/react";

export const Statistic: TaskBit["Statistic"] = ({ statistic, task }) => {
  const { t } = useTranslations(translations);
  const colorKeys = Object.keys(task.view.colors)
    .filter((c) => task.view.colors[c].enabled)
    .sort((a, b) => (a > b ? 1 : -1)) as IHighlightColor[];
  const [currentColor, setCurrentColor] = useState(colorKeys[0]);
  const cells = task.view.text.split("").map((t, i) => {
    const count = statistic.highlights[currentColor][i];

    const relativeCount = count / statistic.count;

    return (
      <span
        title={String(count)}
        style={{
          backgroundColor:
            relativeCount !== 0
              ? shadeColor(colors[currentColor].bg, -(relativeCount * 100 - 50))
              : undefined,
          color: relativeCount !== 0 ? colors[currentColor].fg : "black",
        }}
        key={i}
      >
        {t}
      </span>
    );
  });
  return (
    <Box>
      <Box mb="standard">
        <ButtonGroup attached>
          {colorKeys.map((c, i) => (
            <ButtonOutline
              key={c}
              onClick={() => setCurrentColor(c)}
              css={
                currentColor === c
                  ? css`
                      background-color: ${colors[c].bg};
                      color: ${colors[c].fg};
                    `
                  : null
              }
            >
              {t(`${c}-button`, { id: i + 1 })}
            </ButtonOutline>
          ))}
        </ButtonGroup>
      </Box>
      <Box
        borderColor="primary.800"
        borderWidth="standard"
        borderRadius="standard"
        borderStyle="solid"
        overflowX="auto"
      >
        <Box as="pre" margin="standard" display="inline-block">
          {cells}
        </Box>
      </Box>
    </Box>
  );
};
