import { Icon, IconProps } from "@openpatch/patches";
import { Play } from "@openpatch/patches/dist/cjs/icons/shade";

export const StartedIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="neutral" size={size}>
    <Play />
  </Icon>
);
