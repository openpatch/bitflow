import * as inputBit from "@bitflow/input-markdown";
import { InputBitDoc } from "../../../components/InputBitDoc";

export default function InputMarkdown() {
  return (
    <InputBitDoc<inputBit.IInput>
      description=""
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
