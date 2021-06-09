import { Icon } from "@openpatch/patches";
import { Help } from "@openpatch/patches/dist/cjs/icons/shade";
import { Fragment } from "react";

export type HelpDialogProps = {};

export const HelpDialog = ({}: HelpDialogProps) => {
  return (
    <Fragment>
      <Icon>
        <Help />
      </Icon>
    </Fragment>
  );
};
