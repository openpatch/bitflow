import { Icon, IconProps } from "@openpatch/patches";
import { Asterisk } from "@openpatch/patches/dist/cjs/icons/shade";

export const ManualIcon = ({ size = "large" }: Pick<IconProps, "size">) => (
  <Icon color="warning" size={size}>
    <Asterisk />
  </Icon>
);
