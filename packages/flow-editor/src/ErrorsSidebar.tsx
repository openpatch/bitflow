import { FC } from "react";
import { UseFormMethods } from "react-hook-form";

export type ErrorsSidebarProps = {
  errors?: UseFormMethods["errors"];
};

export const ErrorsSidebar: FC<ErrorsSidebarProps> = ({ errors }) => {
  console.log(errors);
  return <div>{JSON.stringify(errors, null, 2)}</div>;
};
