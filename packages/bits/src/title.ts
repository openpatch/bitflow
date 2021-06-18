import { TitleViewFormProps } from "@bitflow/base";
import * as simple from "@bitflow/title-simple";
import { ReactElement } from "react";
import { ZodSchema } from "zod";

export type TitleBit = {
  ViewForm: (props: TitleViewFormProps) => ReactElement | null;
  Title: (props: any) => ReactElement | null;
  TitleSchema: ZodSchema<any>;
};

const asTitleBit = <T>(et: { [K in keyof T]: TitleBit }) => et;

export const titleBits = asTitleBit({
  simple,
});

export const TitleBitsSchema = simple.TitleSchema;

export const TitleBitsPublicSchema = simple.TitleSchema.pick({
  name: true,
  subtype: true,
  view: true,
});
