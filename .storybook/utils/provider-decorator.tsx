import * as endTries from "@bitflow/end-tries";
import * as inputMarkdown from "@bitflow/input-markdown";
import { BitflowProvider } from "@bitflow/provider";
import * as startSimple from "@bitflow/start-simple";
import * as taskChoice from "@bitflow/task-choice";
import * as taskFillInTheBlank from "@bitflow/task-fill-in-the-blank";
import * as taskInput from "@bitflow/task-input";
import * as taskYesNo from "@bitflow/task-input";
import * as titleSimple from "@bitflow/title-simple";
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
          tries: endTries,
        },
        task: {
          choice: taskChoice,
          "fill-in-the-blank": taskFillInTheBlank,
          input: taskInput,
          "yes-no": taskYesNo,
        },
        input: {
          markdown: inputMarkdown,
        },
        start: {
          simple: startSimple,
        },
        title: {
          simple: titleSimple,
        },
      }}
    >
      <Story {...context} />
    </BitflowProvider>
  );
};
