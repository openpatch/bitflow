import * as inputBit from "@bitflow/input-markdown";
import { InputBitDoc } from "../../../components/InputBitDoc";

export default function InputMarkdown() {
  return (
    <InputBitDoc<inputBit.IInput>
      description={`
An markdown based input bit to display information to a user. Since you can use
markdown, you can display images, videos, tables or just text.
      `}
      inputBit={inputBit}
      defaultValues={{
        description: "",
        subtype: "markdown",
        view: {
          markdown: "# This is an input",
        },
        name: "Example",
      }}
    ></InputBitDoc>
  );
}
