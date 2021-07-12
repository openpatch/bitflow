import { BitflowProvider } from "@bitflow/provider";
import { Story, StoryContext } from "@storybook/react";
import React from "react";

export default (Story: Story, context?: StoryContext) => {
  const locale = context?.globals.locale;
  return (
    <BitflowProvider
      locale={locale}
      config={{}}
      bits={{
        end: {
          tries: import("@bitflow/end-tries"),
        },
        task: {
          choice: import("@bitflow/task-choice"),
          "fill-in-the-blank": import("@bitflow/task-fill-in-the-blank"),
          input: import("@bitflow/task-input"),
        },
        input: {
          markdown: import("@bitflow/input-markdown"),
        },
        start: {
          simple: import("@bitflow/start-simple"),
        },
        title: {
          simple: import("@bitflow/title-simple"),
        },
      }}
    >
      <Story {...context} />
    </BitflowProvider>
  );
};
