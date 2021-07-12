import { DoTry } from "@bitflow/core";
import { useTranslations } from "@vocab/react";
import { Fragment, ReactNode } from "react";
import translations from "./locales.vocab";

export type StatusFooterProps = {
  status: Record<DoTry["status"], number>;
};

export const StatusFooter = ({ status }: StatusFooterProps) => {
  const { t } = useTranslations(translations);
  const s: ReactNode[] = [];
  return (
    <Fragment>
      <span title={t("node-started")}>{status.started || 0} </span>|
      <span title={t("node-finished")}> {status.finished || 0} </span>|
      <span title={t("node-skipped")}> {status.skipped || 0}</span>
    </Fragment>
  );
};
