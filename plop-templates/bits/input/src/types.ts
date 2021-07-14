import { InputBit as InputBitBase } from "@bitflow/core";
import { z } from "zod";
import { InputSchema } from "./schemas";

export type IInput = z.infer<typeof InputSchema>;

export type InputBit = InputBitBase<IInput>;
