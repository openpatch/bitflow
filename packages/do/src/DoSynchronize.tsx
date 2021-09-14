import { Shell, ShellContent, ShellFooter, ShellHeader } from "@bitflow/shell";
import { Box, ButtonPrimary, ButtonSecondary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useEffect, useRef, useState } from "react";
import translations from "./locales.vocab";
import { DoProgress, DoPropsBase } from "./types";

export const DoSynchronize = ({
  onNext,
  getProgress,
}: Pick<DoPropsBase, "onNext" | "getProgress">) => {
  const { t } = useTranslations(translations);
  const timer = useRef<NodeJS.Timeout>();
  const [progress, setProgress] = useState<Pick<DoProgress, "next">>({
    next: "locked",
  });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    if (!refreshing) {
      setRefreshing(true);
      if (timer.current) {
        clearTimeout(timer.current);
      }
      getProgress()
        .then((p) => setProgress(p))
        .then(() => {
          timer.current = setTimeout(refresh, 5000);
        })
        .finally(() => setRefreshing(false));
    }
  };

  const forceRefresh = () => {
    setRefreshing(false);
    refresh();
  };

  useEffect(() => {
    refresh();
  }, [getProgress]);

  return (
    <Shell>
      <ShellHeader>{t("synchronize")}</ShellHeader>
      <ShellContent>{t("synchronize-text")}</ShellContent>
      <ShellFooter>
        <Box flex="2">
          <ButtonPrimary disabled={progress.next === "locked"} onClick={onNext}>
            {t("next")}
          </ButtonPrimary>
        </Box>
        <Box flex="1">
          <ButtonSecondary
            tone="accent"
            loading={refreshing}
            onClick={forceRefresh}
          >
            {t("refresh")}
          </ButtonSecondary>
        </Box>
      </ShellFooter>
    </Shell>
  );
};
