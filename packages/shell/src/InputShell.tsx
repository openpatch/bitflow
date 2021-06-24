import { Input, InputProps } from "@bitflow/base";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useState } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type InputShellProps<I extends Input> = {
  header?: string;
  input: I;
  InputComponent: FC<InputProps<I>>;
} & IShell;

export const InputShell = <I extends Input>({
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
