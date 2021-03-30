import { Title, TitleProps } from "@bitflow/base";
import { ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { FC } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellFooter, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type TitleShellProps<P extends Title> = {
  title: P;
  header: string;
  TitleComponent: FC<TitleProps<P>>;
} & IShell;

export const TitleShell = <P extends Title>({
  header,
  title,
  TitleComponent,
  onNext,
  onClose,
  onPrevious,
  progress,
}: TitleShellProps<P>) => {
  const { t } = useTranslations(translations);

  return (
    <Shell>
      <ShellHeader
        onClose={onClose}
        onPrevious={onPrevious}
        progress={progress}
      >
        {header}
      </ShellHeader>
      <ShellContent>
        <TitleComponent title={title} />
      </ShellContent>
      <ShellFooter>
        <ButtonPrimary fullWidth onClick={onNext}>
          {t("next")}
        </ButtonPrimary>
      </ShellFooter>
    </Shell>
  );
};
