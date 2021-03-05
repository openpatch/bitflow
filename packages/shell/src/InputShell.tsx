import { ButtonPrimary } from "@openpatch/patches";
import { Input, InputProps } from "@openpatch/bits-base";
import { FC } from "react";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type InputShellProps<I extends Input> = {
  title: string;
  input: I;
  InputComponent: FC<InputProps<I>>;
  locales?: {
    next: string;
  };
} & IShell;

export const InputShell = <I extends Input>({
  title,
  onClose,
  progress,
  InputComponent,
  input,
  locales = {
    next: "Next",
  },
  onNext,
}: InputShellProps<I>) => {
  return (
    <Shell>
      <ShellHeader progress={progress} onClose={onClose}>
        {title}
      </ShellHeader>
      <ShellContent>
        <InputComponent input={input} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {locales.next}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
