import { Privacy, PrivacyProps } from "@bitflow/base";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type PrivacyShellProps<P extends Privacy> = {
  title: string;
  privacy: P;
  PrivacyComponent: FC<PrivacyProps<P>>;
} & IShell;

export const PrivacyShell = <P extends Privacy>({
  title,
  onClose,
  onPrevious,
  progress,
  PrivacyComponent,
  privacy,
  onNext,
}: PrivacyShellProps<P>) => {
  const { t } = useTranslations(translations);
  return (
    <Shell>
      <ShellHeader
        onClose={onClose}
        progress={progress}
        onPrevious={onPrevious}
      >
        {title}
      </ShellHeader>
      <ShellContent>
        <PrivacyComponent privacy={privacy} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {t("accept")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
