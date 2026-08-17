import _get from "lodash.get";
import { useContext } from "react";
import { context, ContextProps } from "./context";

export const useConfig = (
  key: keyof ContextProps["config"],
  defaultValue = null
) => {
  const { config } = useContext(context);
  return _get(config, key, defaultValue);
};
