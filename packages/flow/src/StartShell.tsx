import { Shell, ShellContent, ShellFooter, ShellHeader } from "@bitflow/shell";
import { Box, ButtonPrimary, Markdown } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";
import { IStart } from "./schemas";

export type StartShellProps = {
  start: IStart;
  onNext: () => void;
};

export const StartShell = ({ onNext, start }: StartShellProps) => {
  const { t } = useTranslations(translations);
  return (
    <Shell>
      <ShellHeader>{start.view.title}</ShellHeader>
      <ShellContent>
        <Box padding="standard">
          <Markdown markdown={start.view.markdown} />
        </Box>
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {t("start")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
