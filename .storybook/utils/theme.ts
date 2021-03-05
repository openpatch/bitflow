// @ts-nocheck
import { create } from "@storybook/theming/create";
import { baseTheme } from "@openpatch/patches/dist/esm/themes";

export const theme = create({
  base: "light",
  brandTitle: "Bits",
  brandUrl: "https://github.com/openpatch/bits",
  brandImage: "patches_title.svg",
  fontBase: baseTheme.fonts.body,
  fontCode: baseTheme.fonts.monospace,
  colorPrimary: baseTheme.colors.primary[500],
  colorSecondary: baseTheme.colors.accent[500],
});
