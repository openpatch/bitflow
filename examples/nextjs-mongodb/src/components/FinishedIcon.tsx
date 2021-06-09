import { Icon, IconProps } from "@openpatch/patches";
import { Flag } from "@openpatch/patches/dist/cjs/icons/shade";

export const FinishedIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="neutral" size={size}>
    <Flag />
  </Icon>
);
