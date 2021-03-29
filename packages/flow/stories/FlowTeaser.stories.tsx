import { Meta } from "@storybook/react/types-6-0";
import { FlowTeaser } from "../src/FlowTeaser";

export default {
  title: "Flow/FlowTeaser",
  component: FlowTeaser,
  argTypes: {},
} as Meta;

export const Default = () => (
  <FlowTeaser
    height="240px"
    width="320px"
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
      },
      {
        id: "node-1",
        type: "synchronize",
        position: { x: 250, y: 25 },
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
      },
      {
        id: "bit",
        type: "bit",
        position: { x: 100, y: 0 },
        data: {
          id: "id",
          type: "title",
          subtype: "simple",
          description: "A description",
          name: "Name",
          view: {
            title: "",
            message: "A title message",
          },
        },
      },
      {
        id: "bit-2",
        type: "bit",
        position: { x: 100, y: -10 },
        data: {
          id: "id",
          type: "input",
          description:
            "A description. This is a super long description and other stuff. How is this handled by the flow?",
          name: "Name",
          subtype: "markdown",
          view: {
            markdown: "A title message",
          },
        },
      },
    ]}
  />
);
