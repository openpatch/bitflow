import { css } from "@emotion/react";
import { Box, ButtonGroup, ButtonOutline } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { HTMLAttributes, useEffect, useRef } from "react";
import { colors as col } from "./colors";
import translations from "./locales.vocab";
import { IHighlightColor, IResult, ITask, ITaskState } from "./types";

export type HighlightTextProps = {
  text: string;
  highlights: ITaskState["highlights"];
  selection: ITaskState["selection"];
  onSelect: (from: number, to: number) => void;
  colors: ITask["view"]["colors"];
  onHighlight: (color: IHighlightColor) => () => void;
  feedback?: IResult["highlightsFeedback"];
  onErase: () => void;
  onReset: () => void;
};

export const HighlightText = ({
  text = "",
  highlights = [],
  feedback,
  colors,
  onHighlight,
  selection,
  onSelect,
  onErase,
  onReset,
}: HighlightTextProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslations(translations);
  const colorKeys = Object.keys(colors)
    .filter((c) => colors[c].enabled)
    .sort((a, b) => (a > b ? 1 : -1)) as IHighlightColor[];

  const handleSelect = () => {
    const s = window.getSelection();
    if (s?.type === "Range" && ref.current) {
      const r = s.getRangeAt(0);
      const preSelectionRange = r.cloneRange();
      preSelectionRange.selectNodeContents(ref.current);
      preSelectionRange.setEnd(r.startContainer, r.startOffset);
      const from = preSelectionRange.toString().length;
      const to = from + r.toString().length;

      onSelect(from, to);
    }
  };

  useEffect(() => {
    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, []);

  const handleKeyup = ({ code }: KeyboardEvent) => {
    switch (code) {
      case "Digit1":
        if (colorKeys.length > 0) {
          onHighlight(colorKeys[0])();
        }
        break;
      case "Digit2":
        if (colorKeys.length > 1) {
          onHighlight(colorKeys[1])();
        }
        break;
      case "Digit3":
        if (colorKeys.length > 2) {
          onHighlight(colorKeys[2])();
        }
        break;
      case "Digit4":
        if (colorKeys.length > 3) {
          onHighlight(colorKeys[3])();
        }
        break;
      case "Digit5":
        if (colorKeys.length > 4) {
          onHighlight(colorKeys[4])();
        }
        break;
      case "Delete":
        onErase();
        break;
    }
  };

  const cells = text.split("").map((t, i) => {
    const highlight = highlights[i];
    let bg = undefined;
    let fg = undefined;
    if (highlight) {
      bg = col[highlight].bg;
      fg = col[highlight].fg;
    }

    const style: HTMLAttributes<"span">["style"] = {
      backgroundColor: bg,
      color: fg,
      borderBottomWidth: 0,
      borderBottomStyle: "solid",
    };

    if (feedback?.[i] === "correct") {
      style.borderBottomWidth = 8;
      style.borderBottomColor = "green";
    } else if (feedback?.[i] === "wrong") {
      style.borderBottomWidth = 8;
      style.borderBottomColor = "red";
    }

    return (
      <span data-id={i} style={style} key={i}>
        {t}
      </span>
    );
  });

  useEffect(() => {
    if (selection && ref.current) {
      let charIndex = 0;
      const r = new Range();
      r.setStart(ref.current, 0);
      r.collapse(true);

      const nodeStack: Node[] = [ref.current];
      let node: Node | undefined;
      let foundStart = false;
      let stop = false;

      while (!stop && (node = nodeStack.pop())) {
        if (!node) {
          break;
        }

        if (node.nodeType === 3) {
          const nextCharIndex = charIndex + (node.nodeValue || "").length;
          if (
            !foundStart &&
            selection.from >= charIndex &&
            selection.from <= nextCharIndex
          ) {
            r.setStart(node, selection.from - charIndex);
            foundStart = true;
          }
          if (
            foundStart &&
            selection.to >= charIndex &&
            selection.to <= nextCharIndex
          ) {
            r.setEnd(node, selection.to - charIndex);
            stop = true;
          }
          charIndex = nextCharIndex;
        } else {
          let i = node.childNodes.length;
          while (i--) {
            nodeStack.push(node.childNodes[i]);
          }
        }
      }

      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(r);
    }
  }, [selection]);

  return (
    <Box>
      <Box display="flex" mb="standard" flexWrap="wrap">
        <Box flex="1">
          <ButtonGroup attached>
            {colorKeys.map((c, i) => (
              <ButtonOutline
                css={css`
                  color: ${col[c].fg};
                  background-color: ${col[c].bg};
                `}
                onClick={onHighlight(c as IHighlightColor)}
                title={t("highlight-title", { id: i + 1 })}
              >
                {colors[c].label
                  ? `${colors[c].label} (${i + 1})`
                  : t(`${c as IHighlightColor}-button`, { id: i + 1 })}
              </ButtonOutline>
            ))}
          </ButtonGroup>
        </Box>
        <Box>
          <ButtonGroup attached>
            <ButtonOutline title={t("erase-title")} onClick={onErase}>
              {t("erase")}
            </ButtonOutline>
            <ButtonOutline title={t("reset-title")} onClick={onReset}>
              {t("reset")}
            </ButtonOutline>
          </ButtonGroup>
        </Box>
      </Box>
      <Box
        borderColor="primary.800"
        borderWidth="standard"
        borderRadius="standard"
        borderStyle="solid"
        overflowX="auto"
        ref={ref}
        onPointerUp={handleSelect}
      >
        <Box as="pre" margin="standard" display="inline-block">
          {cells}
        </Box>
      </Box>
    </Box>
  );
};
