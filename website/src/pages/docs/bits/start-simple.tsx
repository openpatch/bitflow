import * as startBit from "@bitflow/start-simple";
import { StartBitDoc } from "../../../components/StartBitDoc";

export default function StartSimple() {
  return (
    <StartBitDoc<startBit.IStart>
      description=""
      defaultValues={{
        description: "",
        name: "",
        subtype: "simple",
        view: {
          markdown:
            "Welcome to our little assessment. This is a description of it and what we will do with your data.",
          title: "Programming in C",
        },
      }}
      startBit={startBit}
    />
  );
}
