declare module "react-tagcloud" {
  import * as React from "react";
  export interface Tag {
    value: string;
    count: number;
    key?: string;
    color?: string;
    props?: Record<string, any>;
  }

  export interface ColorOptions {
    hue?: string;
    luminosity?: "bright" | "light" | "dark";
    seed?: number;
    format?: "rgb" | "rgba" | "rgbArray" | "hsl" | "hsla" | "hslArray" | "hex";
    alpha?: number;
  }

  export interface TagCloudProps {
    tags: Tag[];
    maxSize: number;
    minSize: number;
    shuffle?: boolean;
    colorOptions?: ColorOptions;
    disableRandomColor?: boolean
    randomSeed?: number
    renderer?: (tag: Tag, size: number, color: string) => JSX.Element
  }

  export class TagCloud extends React.Component<TagCloudProps> {

  }

}
