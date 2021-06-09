import { Icon, IconProps } from "@openpatch/patches";
import { ThumbsUp } from "@openpatch/patches/dist/cjs/icons/shade";

export const CorrectIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="success" size={size}>
    <ThumbsUp />
  </Icon>
);
