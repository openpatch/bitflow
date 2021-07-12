import { generateDoResult } from "@bitflow/mock";
import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import { DoEnd } from "../src/DoEnd";

export default {
  title: "Do/DoEnd",
  component: DoEnd,
} as Meta;

export const WithResult = () => {
  return (
    <Box position="absolute" height="100vh" width="100vw">
      <DoEnd
        node={{
          id: "a-id",
          position: { x: 0, y: 0 },
          type: "end",
          data: {
            name: "",
            description: "",
            subtype: "tries",
            view: {
              markdown: "# Title",
            },
          },
        }}
        onNext={async () => {}}
        getResult={generateDoResult}
      />
    </Box>
  );
};
