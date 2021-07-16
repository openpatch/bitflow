import * as inputBit from "@bitflow/input-markdown";
import { InputBitDoc } from "../../../components/InputBitDoc";

export default function InputMarkdown() {
  const information = inputBit.useInformation();
  return <InputBitDoc inputBit={inputBit} {...information}></InputBitDoc>;
}
