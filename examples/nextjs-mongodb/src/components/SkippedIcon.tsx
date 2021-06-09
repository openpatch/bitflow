import { Icon, IconProps } from "@openpatch/patches";
import { FastForward } from "@openpatch/patches/dist/cjs/icons/shade";

export const SkippedIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="info" size={size}>
    <FastForward />
  </Icon>
);
