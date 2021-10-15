import { Box } from "@openpatch/patches";
import { Meta } from "@storybook/react/types-6-0";
import { useState } from "react";
import { Flow } from "../src/Flow";

export default {
  title: "Flow/Flow",
  component: Flow,
  argTypes: {},
} as Meta;

export const Default = () => {
  const [synchronizeState, setSynchronizeState] = useState(false);

  return (
    <Box height="100vh" width="100vw">
      <Flow
        edges={[
          {
            id: "edge-1",
            source: "node-2",
            target: "node-1",
          },
          {
            id: "edge-2",
            source: "start",
            target: "bit",
          },
        ]}
        nodes={[
          {
            id: "start",
            type: "start",
            position: { x: 0, y: 5 },
            data: {
              name: "Start",
              description: "",
              subtype: "simple",
              view: {
                markdown: "",
                title: "",
              },
            },
          },
          {
            id: "node-1",
            type: "synchronize",
            position: { x: 250, y: 25 },
            data: {
              toggle: () => setSynchronizeState((s) => !s),
              unlocked: synchronizeState,
            } as any,
          },
          {
            id: "node-2",
            type: "checkpoint",
            position: { x: 100, y: 5 },
          },
          {
            id: "node-3",
            type: "split-random",
            position: { x: 100, y: 25 },
          },
          {
            id: "end",
            type: "end",
            position: { x: 400, y: 5 },
            data: {
              name: "End",
              description: "",
              subtype: "tries",
              view: {
                markdown: "",
              },
            },
          },
          {
            id: "bit",
            type: "title",
            position: { x: 100, y: 0 },
            data: {
              subtype: "simple",
              description: "A description",
              name: "Name",
              view: {
                message: "A title message",
                title: "",
              },
            },
          },
          {
            id: "bit-2",
            type: "input",
            position: { x: 100, y: -10 },
            data: {
              subtype: "markdown",
              name: "Name",
              description:
                "A description. This is a super long description and other stuff. How is this handled by the flow?",
              view: {
                markdown: "A title message",
              },
            },
          },
        ]}
      />
    </Box>
  );
};
