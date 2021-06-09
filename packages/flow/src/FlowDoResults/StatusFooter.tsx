import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { FlowDoResultPathEntry } from "../FlowDo";
import translations from "../locales.vocab";

export type StatusFooterProps = {
  status: Record<FlowDoResultPathEntry["status"], number>;
};

export const StatusFooter = ({ status }: StatusFooterProps) => {
  const { t } = useTranslations(translations);
  return (
    <Fragment>
      <span title={t("node-started")}>{status.started} </span>|
      <span title={t("node-finished")}> {status.finished} </span>|
      <span title={t("node-skipped")}> {status.skipped}</span>
    </Fragment>
  );
};
