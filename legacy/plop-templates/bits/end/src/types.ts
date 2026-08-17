import { EndBit as EndBitBase } from "@bitflow/core";
import { z } from "zod";
import { EndSchema } from "./schemas";

export type IEnd = z.infer<typeof EndSchema>;

export type EndBit = EndBitBase<IEnd>;
