import { InputViewFormProps } from "@bitflow/base";
import * as markdown from "@bitflow/input-markdown";
import { ReactElement } from "react";
import { ZodSchema } from "zod";

type InputBit = {
  ViewForm: (props: InputViewFormProps) => ReactElement | null;
  Input: (props: any) => ReactElement | null;
  InputSchema: ZodSchema<any>;
};

const asInputBit = <T>(et: { [K in keyof T]: InputBit }) => et;

export const inputBits = asInputBit({
  markdown,
});

export const InputBitsSchema = markdown.InputSchema;

export const InputBitsPublicSchema = markdown.InputSchema.pick({
  name: true,
  subtype: true,
  view: true,
});
