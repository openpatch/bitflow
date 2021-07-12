import { EndProps } from "@bitflow/core";
import { useTranslations } from "@vocab/react";
import { FC, useState } from "react";
import translations from "./locales.vocab";
import { Shell, ShellContent, ShellHeader } from "./Shell";
import { IShell } from "./types";

export type EndShellProps<E extends Bitflow.End> = {
  end: E;
  header?: string;
  EndComponent: FC<EndProps<E>>;
  getResult: EndProps<any>["getResult"];
} & IShell;

export const EndShell = <E extends Bitflow.End>({
  onNext,
  end,
  EndComponent,
  onClose,
  getResult,
  progress,
  header,
}: EndShellProps<E>) => {
  const { t } = useTranslations(translations);
  const [state, setState] = useState<"default" | "next" | "close">("default");

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
          onClose={onClose ? handleClose : undefined}
          disabled={state !== "default"}
          progress={progress}
        >
          {header}
        </ShellHeader>
      )}
      <ShellContent>
        <EndComponent getResult={getResult} end={end} />
      </ShellContent>
    </Shell>
  );
};
