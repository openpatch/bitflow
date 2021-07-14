import { Box } from "@openpatch/patches";
import { EndBit } from "./types";

export const End: EndBit["End"] = ({ end, getResult }) => (
  <Box p="standard">{end.view.example}</Box>
);
