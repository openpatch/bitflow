import "@emotion/react";
import { Theme as PatchesTheme } from "@openpatch/patches";
declare module "@emotion/react" {
  export interface Theme extends PatchesTheme {}
}
