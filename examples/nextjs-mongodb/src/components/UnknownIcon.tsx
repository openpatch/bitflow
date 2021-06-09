import { Icon, IconProps } from "@openpatch/patches";
import { Help } from "@openpatch/patches/dist/cjs/icons/shade";

export const UnknownIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="accent" size={size}>
    <Help />
  </Icon>
);
