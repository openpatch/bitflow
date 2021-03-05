import { Alert } from "@openpatch/patches";
import { FC } from "react";
import { IFeedbackMessage } from "./types";

export type FeedbackProps = IFeedbackMessage;

export const Feedback: FC<FeedbackProps> = ({ message, severity }) => {
  return <Alert severity={severity}>{message}</Alert>;
};
