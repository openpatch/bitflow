import { InputProps } from "@bitflow/core";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useState } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type InputShellProps<I extends Bitflow.Input> = {
  header?: string;
  input: I;
  InputComponent: FC<InputProps<I>>;
} & IShell;

export const InputShell = <I extends Bitflow.Input>({
  header,
  onClose,
  onPrevious,
  progress,
  InputComponent,
  input,
  onNext,
}: InputShellProps<I>) => {
  const [state, setState] = useState<"default" | "next" | "previous" | "close">(
    "default"
  );
  const { t } = useTranslations(translations);

  const handleNext = () => {
    if (onNext) {
      setState("next");
      onNext().catch(() => {
        setState("default");
      });
    }
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
          progress={progress}
          loadingClose={state === "close"}
          loadingPrevious={state === "previous"}
          onClose={onClose ? handleClose : undefined}
          onPrevious={onPrevious ? handlePrevious : undefined}
          disabled={state !== "default"}
        >
          {header}
        </ShellHeader>
      )}
      <ShellContent>
        <InputComponent input={input} />
      </ShellContent>
      <ShellFooter>
        {onNext && (
          <ButtonPrimary
            fullWidth
            onClick={handleNext}
            disabled={state !== "default"}
            loading={state === "next"}
          >
            {t("next")}
          </ButtonPrimary>
        )}
      </ShellFooter>
    </Shell>
  );
};
