import { Meta } from "@storybook/react/types-6-0";
import { FlowDoResultsList } from "../src/FlowDoResultsList";

export default {
  title: "Flow/FlowDoResultsList",
  component: FlowDoResultsList,
  argTypes: {},
} as Meta;

export const Default = () => {
  return (
    <FlowDoResultsList
      results={[
        {
          avgTries: 4,
          currentNode: {
            id: "test",
            name: "hi",
          },
          session: "abcdfeg",
          startDate: new Date(),
          states: {
            correct: 0,
            manual: 0,
            unknown: 0,
            wrong: 0,
          },
        },
        {
          avgTries: 4,
          currentNode: {
            id: "test",
            name: "hi",
          },
          session: "abcdfeg",
          startDate: new Date(),
          states: {
            correct: 0,
            manual: 0,
            unknown: 0,
            wrong: 0,
          },
        },
      ]}
    />
  );
};
