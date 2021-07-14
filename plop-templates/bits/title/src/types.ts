import { TitleBit as TitleBitBase } from "@bitflow/core";
import { z } from "zod";
import { TitleSchema } from "./schemas";

export type ITitle = z.infer<typeof TitleSchema>;

export type TitleBit = TitleBitBase<ITitle>;
