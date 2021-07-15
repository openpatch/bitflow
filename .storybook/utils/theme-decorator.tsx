import { css, Global, Theme } from "@emotion/react";
import { Box, Card, CardContent, ThemeProvider } from "@openpatch/patches";
import * as themes from "@openpatch/patches/themes";
import { Story, StoryContext } from "@storybook/react";
import React from "react";

export default (Story: Story, context?: StoryContext) => {
  const selectedTheme = themes[context?.globals.theme] as Theme;
  const background = context?.globals.backgrounds;

  return (
    <ThemeProvider theme={selectedTheme}>
      <Global
        styles={css`
          @import url("https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");
        `}
      ></Global>
      {background === "none" && <Story {...context} />}
      {background === "padded" && (
        <Box p="standard">
          <Story {...context} />
        </Box>
      )}
      {background === "card" && (
        <Box p="standard">
          <Card>
            <Story {...context} />
          </Card>
        </Box>
      )}
      {background === "card-padded" && (
        <Box p="standard">
          <Card>
            <CardContent>
              <Story {...context} />
            </CardContent>
          </Card>
        </Box>
      )}
    </ThemeProvider>
  );
};
