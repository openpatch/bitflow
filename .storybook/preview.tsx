import * as themes from "@openpatch/patches/dist/esm/themes";
import withBitProvider from "./utils/provider-decorator";
import withTheme from "./utils/theme-decorator";

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
  locale: {
    name: "Locale",
    description: "Locale",
    defaultValue: "en",
    toolbar: {
      icon: "globe",
      items: [
        {
          value: "en",
          title: "english",
        },
        {
          value: "de",
          title: "german",
        },
      ],
    },
  },
};

export const decorators = [withTheme, withBitProvider];
