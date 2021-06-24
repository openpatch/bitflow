import { Input, InputProps, InputViewFormProps } from "@bitflow/base";
import * as markdown from "@bitflow/input-markdown";
import { ReactElement } from "react";
import { ZodSchema } from "zod";

export type InputBit<I extends Input = any> = {
  ViewForm: (props: InputViewFormProps) => ReactElement | null;
  Input: (props: InputProps<I>) => ReactElement | null;
  InputSchema: ZodSchema<any>;
};

export const asInputBit = <T>(et: { [K in keyof T]: InputBit }) => et;

export const inputBits = asInputBit({
  markdown,
});

export const InputBitsSchema = markdown.InputSchema;

export const InputBitsPublicSchema = markdown.InputSchema.pick({
  name: true,
  subtype: true,
  view: true,
});
