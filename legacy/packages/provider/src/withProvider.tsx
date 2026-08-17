import { WithConditionalCSSProp } from "@emotion/react/types/jsx-namespace";
import { ComponentType, PropsWithChildren } from "react";
import { BitflowProvider, BitflowProviderProps } from "./Provider";

export const withBitflowProvider = <T extends object>(
  WrappedComponent: ComponentType<T>
) => {
  // props need to be casted. See https://github.com/emotion-js/emotion/issues/2169
  const Wrapper = ({
    locale,
    config,
    bits,
    ...props
  }: BitflowProviderProps &
    T &
    WithConditionalCSSProp<PropsWithChildren<T>>) => {
    return (
      <BitflowProvider locale={locale} config={config} bits={bits}>
        <WrappedComponent
          {...(props as T & WithConditionalCSSProp<PropsWithChildren<T>>)}
        />
      </BitflowProvider>
    );
  };

  return Wrapper;
};
