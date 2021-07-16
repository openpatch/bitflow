import * as startBit from "@bitflow/start-simple";
import { StartBitDoc } from "../../../components/StartBitDoc";

export default function StartSimple() {
  const information = startBit.useInformation();
  return <StartBitDoc {...information} startBit={startBit} />;
}
