import * as endBit from "@bitflow/end-tries";
import { EndBitDoc } from "../../../components/EndBitDoc";

export default function EndTries() {
  return (
    <EndBitDoc<endBit.IEnd>
      description=""
      defaultValues={{
        description: "",
        name: "",
        subtype: "tries",
        view: {
          markdown: "Try overview",
        },
      }}
      endBit={endBit}
    />
  );
}
