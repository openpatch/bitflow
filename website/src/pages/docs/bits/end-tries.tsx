import * as endBit from "@bitflow/end-tries";
import { EndBitDoc } from "../../../components/EndBitDoc";

export default function EndTries() {
  const information = endBit.useInformation();
  return <EndBitDoc {...information} endBit={endBit} />;
}
