import { StartBit as StartBitBase } from "@bitflow/core";
import { z } from "zod";
import { StartSchema } from "./schemas";

export type IStart = z.infer<typeof StartSchema>;

export type StartBit = StartBitBase<IStart>;
