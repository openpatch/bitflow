import { Icon, IconProps } from "@openpatch/patches";
import { ThumbsDown } from "@openpatch/patches/dist/cjs/icons/shade";

export const WrongIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="error" size={size}>
    <ThumbsDown />
  </Icon>
);
