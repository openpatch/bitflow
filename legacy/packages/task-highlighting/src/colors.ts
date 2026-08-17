import { IHighlightColor } from "./types";

// based on https://sashamaps.net/docs/resources/20-colors/ 99.99%
export const colors: Record<
  IHighlightColor,
  {
    bg: string;
    fg: string;
  }
> = {
  blue: { bg: "#4363d8", fg: "#FFFFFF" },
  lavender: { bg: "#dcbeff", fg: "#000000" },
  maroon: {
    bg: "#800000",
    fg: "#FFFFFF",
  },
  orange: {
    bg: "#f58231",
    fg: "#FFFFFF",
  },
  yellow: { bg: "#ffe119", fg: "#000000" },
};

export function shadeColor(col: string, amt: number) {
  var usePound = false;

  if (col[0] == "#") {
    col = col.slice(1);
    usePound = true;
  }

  var num = parseInt(col, 16);

  var r = (num >> 16) + amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  var b = ((num >> 8) & 0x00ff) + amt;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  var g = (num & 0x0000ff) + amt;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}
