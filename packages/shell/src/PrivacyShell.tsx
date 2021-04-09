import { Privacy, PrivacyProps } from "@bitflow/base";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC, useState } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type PrivacyShellProps<P extends Privacy> = {
  header: string;
  privacy: P;
  PrivacyComponent: FC<PrivacyProps<P>>;
} & IShell;

export const PrivacyShell = <P extends Privacy>({
  header,
  onClose,
  onPrevious,
  progress,
  PrivacyComponent,
  privacy,
  onNext,
}: PrivacyShellProps<P>) => {
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
    <Shell>
      <ShellHeader
        onClose={handleClose}
        progress={progress}
        onPrevious={handlePrevious}
      >
        {header}
      </ShellHeader>
      <ShellContent>
        <PrivacyComponent privacy={privacy} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary
          fullWidth
          onClick={handleNext}
          disabled={state !== "default"}
          loading={state !== "default"}
        >
          {t("accept")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
