import { Flow } from "@bitflow/core";
import { FC } from "react";
import { FormState } from "react-hook-form";

export type ErrorsSidebarProps = {
  errors?: FormState<Flow>["errors"];
};

export const ErrorsSidebar: FC<ErrorsSidebarProps> = ({ errors }) => {
  console.log(errors);
  return <div>{JSON.stringify(errors, null, 2)}</div>;
};
