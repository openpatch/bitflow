import { Box } from "@openpatch/patches";
import { InputBit } from "./types";

export const Input: InputBit["Input"] = ({ input }) => (
  <Box p="standard">{input.view.example}</Box>
);
