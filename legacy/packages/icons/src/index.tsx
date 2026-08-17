import { Icon, IconProps } from "@openpatch/patches";
import {
  Asterisk,
  FastForward,
  Flag,
  Help,
  Play,
  ThumbsDown,
  ThumbsUp,
} from "@openpatch/patches/icons/shade";

export const CorrectIcon = (props: IconProps) => (
  <Icon color="success" size="large" {...props}>
    <ThumbsUp />
  </Icon>
);

export const WrongIcon = (props: IconProps) => (
  <Icon color="error" size="large" {...props}>
    <ThumbsDown />
  </Icon>
);

export const SkippedIcon = (props: IconProps) => (
  <Icon color="info" size="large" {...props}>
    <FastForward />
  </Icon>
);

export const ManualIcon = (props: IconProps) => (
  <Icon color="warning" size="large" {...props}>
    <Asterisk />
  </Icon>
);

export const UnknownIcon = (props: IconProps) => (
  <Icon color="neutral" size="large" {...props}>
    <Help />
  </Icon>
);

export const StartedIcon = (props: IconProps) => (
  <Icon color="neutral" size="large" {...props}>
    <Play />
  </Icon>
);

export const FinishedIcon = (props: IconProps) => (
  <Icon color="neutral" size="large" {...props}>
    <Flag />
  </Icon>
);
