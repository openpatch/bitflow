import { TaskResult } from "@bitflow/base";
import { Shell, ShellContent, ShellHeader } from "@bitflow/shell";
import { Box, Markdown, Text } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { IEnd } from "./schemas";

export type EndShellProps = {
  end: IEnd;
  points?: number;
  results?: TaskResult[];
};

export const EndShell = ({ points, results, end }: EndShellProps) => {
  const { t } = useTranslations(translations);
  return (
    <Shell>
      <ShellHeader>{t("end")}</ShellHeader>
      <ShellContent>
        <Box padding="standard">
          {points !== undefined && (
            <Text textAlign="center" textColor="primary.600" fontSize="large">
              {t("end-points", { points })}
            </Text>
          )}
          <Markdown markdown={end.view.markdown} />
        </Box>
      </ShellContent>
    </Shell>
  );
};
