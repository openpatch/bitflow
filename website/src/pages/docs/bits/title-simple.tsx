import * as titleBit from "@bitflow/title-simple";
import { TitleBitDoc } from "../../../components/TitleBitDoc";

export default function TitleMarkdown() {
  const information = titleBit.useInformation();
  return <TitleBitDoc {...information} titleBit={titleBit}></TitleBitDoc>;
}
