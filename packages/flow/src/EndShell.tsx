import { Shell, ShellContent, ShellHeader } from "@bitflow/shell";
import { AutoGrid, Box, Markdown, Text } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FlowResultPathEntry } from "./FlowDo";
import translations from "./locales.vocab";
import { IEnd } from "./schemas";

export type EndShellProps = {
  end: IEnd;
  points?: number;
  maxPoints?: number;
  results?: FlowResultPathEntry[][];
};

export const EndShell = ({
  points,
  maxPoints,
  results = [],
  end,
}: EndShellProps) => {
  const { t } = useTranslations(translations);
  return (
    <Shell>
      <ShellHeader>{t("end")}</ShellHeader>
      <ShellContent>
        <Box padding="standard">
          <AutoGrid gap="standard">
            {points !== undefined && maxPoints !== undefined && (
              <Text textAlign="center" textColor="primary.600" fontSize="large">
                {t("end-points", { points, maxPoints })}
              </Text>
            )}
            <Markdown markdown={end.view.markdown} />
          </AutoGrid>
        </Box>
      </ShellContent>
    </Shell>
  );
};
