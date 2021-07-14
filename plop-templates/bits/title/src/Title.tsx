import { Box } from "@openpatch/patches";
import { TitleBit } from "./types";

export const Title: TitleBit["Title"] = ({ title }) => (
  <Box p="standard">{title.view.example}</Box>
);
