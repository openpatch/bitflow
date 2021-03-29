import { BitflowProvider } from "@bitflow/provider";
import { Story, StoryContext } from "@storybook/react";
import React from "react";

export default (Story: Story, context?: StoryContext) => {
  const locale = context?.globals.locale;
  return (
    <BitflowProvider locale={locale} config={{}}>
      <Story {...context} />
    </BitflowProvider>
  );
};
