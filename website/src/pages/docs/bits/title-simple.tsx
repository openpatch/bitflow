import * as titleBit from "@bitflow/title-simple";
import { TitleBitDoc } from "../../../components/TitleBitDoc";

export default function TitleMarkdown() {
  return (
    <TitleBitDoc<titleBit.ITitle>
      description=""
      titleBit={titleBit}
      defaultValues={{
        description: "",
        subtype: "simple",
        view: {
          title: "Welcome",
          message: "This is a great assessment",
        },
        name: "Example",
      }}
    ></TitleBitDoc>
  );
}
