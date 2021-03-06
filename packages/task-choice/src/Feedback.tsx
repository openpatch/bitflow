import { FeedbackMessage } from "@bitflow/core";
import { Alert } from "@openpatch/patches";
import { FC } from "react";

export type FeedbackProps = FeedbackMessage;

export const Feedback: FC<FeedbackProps> = ({ message, severity }) => {
  return <Alert severity={severity}>{message}</Alert>;
};
