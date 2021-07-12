import * as titleBit from "@bitflow/title-simple";
import { TitleBitDoc } from "../../../components/TitleBitDoc";

export default function TitleMarkdown() {
  return (
    <TitleBitDoc<titleBit.ITitle>
      description={`
A title bit for displaying a simple title consiting of a title and a message,
which can be written in Markdown to give you more flexability.
`}
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
