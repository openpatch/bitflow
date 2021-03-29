import { Input, InputProps } from "@bitflow/base";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type InputShellProps<I extends Input> = {
  title: string;
  input: I;
  InputComponent: FC<InputProps<I>>;
} & IShell;

export const InputShell = <I extends Input>({
  title,
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
        {title}
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
