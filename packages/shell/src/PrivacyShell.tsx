import { ButtonPrimary } from "@openpatch/patches";
import { Privacy, PrivacyProps } from "@openpatch/bits-base";
import { FC } from "react";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type PrivacyShellProps<P extends Privacy> = {
  title: string;
  onClose?: () => void;
  privacy: P;
  PrivacyComponent: FC<PrivacyProps<P>>;
  locales?: {
    accept: string;
  };
} & IShell;

export const PrivacyShell = <P extends Privacy>({
  title,
  onClose,
  PrivacyComponent,
  privacy,
  locales = {
    accept: "Accept",
  },
  onNext,
}: PrivacyShellProps<P>) => {
  return (
    <Shell>
      <ShellHeader onClose={onClose}>{title}</ShellHeader>
      <ShellContent>
        <PrivacyComponent privacy={privacy} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {locales.accept}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
