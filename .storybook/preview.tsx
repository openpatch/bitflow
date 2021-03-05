import withTheme from "./utils/theme-decorator";
import * as themes from "@openpatch/patches/dist/esm/themes";

export const parameters = {
  layout: "fullscreen",
  actions: { argTypesRegex: "^on[A-Z].*" },
  a11y: {},
  viewport: {
    defaultViewport: "mobile",
    viewports: {
      mobile: {
        name: "Mobile",
        styles: {
          width: "414px",
          height: "736px",
        },
      },
      tablet: {
        name: "Tablet",
        styles: {
          width: "768px",
          height: "1024px",
        },
      },
      desktop: {
        name: "Desktop",
        styles: {
          width: "1200px",
          height: "1600px",
        },
      },
    },
  },
};

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Global theme for components",
    defaultValue: "baseTheme",
    toolbar: {
      icon: "paintbrush",
      // array of plain string values or MenuItem shape (see below)
      items: Object.keys(themes),
    },
  },
  backgrounds: {
    name: "Background",
    description: "Background displaying the component on",
    defaultValue: "none",
    toolbar: {
      icon: "photo",
      items: [
        { value: "none", title: "None" },
        { value: "padded", title: "Padded" },
        { value: "card", title: "Card" },
        { value: "card-padded", title: "Card Padded" },
      ],
    },
  },
};

export const decorators = [withTheme];
