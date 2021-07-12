import { StartProps } from "@bitflow/core";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useState } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type StartShellProps<S extends Bitflow.Start> = {
  start: S;
  header?: string;
  StartComponent: FC<StartProps<S>>;
} & IShell;

export const StartShell = <S extends Bitflow.Start>({
  onNext,
  start,
  StartComponent,
  onClose,
  progress,
  header,
}: StartShellProps<S>) => {
  const { t } = useTranslations(translations);
  const [state, setState] = useState<"default" | "next" | "close">("default");

  const handleClose = () => {
    if (onClose) {
      setState("close");
      onClose().catch(() => {
        setState("default");
      });
    }
  };

  const handleNext = () => {
    if (onNext) {
      setState("next");
      onNext().catch(() => {
        setState("default");
      });
    }
  };

  return (
    <Shell noHeader={!header}>
      {header && (
        <ShellHeader
          loadingClose={state === "close"}
          onClose={onClose ? handleClose : undefined}
          disabled={state !== "default"}
          progress={progress}
        >
          {header}
        </ShellHeader>
      )}
      <ShellContent>
        <StartComponent start={start} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary
          fullWidth
          onClick={handleNext}
          disabled={state !== "default"}
          loading={state === "next"}
        >
          {t("start")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
