import { Input, InputProps } from "@bitflow/base";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type InputShellProps<I extends Input> = {
  header: string;
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
  const { t } = useTranslations(translations);
  return (
    <Shell>
      <ShellHeader
        progress={progress}
        onClose={onClose}
        onPrevious={onPrevious}
      >
        {header}
      </ShellHeader>
      <ShellContent>
        <InputComponent input={input} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {t("next")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
