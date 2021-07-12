import { TitleProps } from "@bitflow/core";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useState } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type TitleShellProps<P extends Bitflow.Title> = {
  title: P;
  header?: string;
  TitleComponent: FC<TitleProps<P>>;
} & IShell;

export const TitleShell = <P extends Bitflow.Title>({
  header,
  title,
  TitleComponent,
  onNext,
  onClose,
  onPrevious,
  progress,
}: TitleShellProps<P>) => {
  const [state, setState] = useState<"default" | "next" | "previous" | "close">(
    "default"
  );
  const { t } = useTranslations(translations);

  const handleNext = () => {
    setState("next");
    onNext().catch(() => {
      setState("default");
    });
  };

  const handlePrevious = () => {
    if (onPrevious) {
      setState("previous");
      onPrevious().catch(() => {
        setState("default");
      });
    }
  };

  const handleClose = () => {
    if (onClose) {
      setState("close");
      onClose().catch(() => {
        setState("default");
      });
    }
  };

  return (
    <Shell noHeader={!header}>
      {header && (
        <ShellHeader
          loadingClose={state === "close"}
          loadingPrevious={state === "previous"}
          onClose={onClose ? handleClose : undefined}
          onPrevious={onPrevious ? handlePrevious : undefined}
          progress={progress}
          disabled={state !== "default"}
        >
          {header}
        </ShellHeader>
      )}
      <ShellContent>
        <TitleComponent title={title} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary
          fullWidth
          onClick={handleNext}
          disabled={state !== "default"}
          loading={state === "next"}
        >
          {t("next")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
