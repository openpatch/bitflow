import { Box } from "@openpatch/patches";
import { StartBit } from "./types";

export const Start: StartBit["Start"] = ({ start }) => (
  <Box p="standard">{start.view.example}</Box>
);
