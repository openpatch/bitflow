const path = require("path");
const toPath = (_path) => path.join(process.cwd(), _path);

module.exports = {
  reactOptions: {
    fastRefresh: true,
    strictMode: true,
  },
  stories: ["../packages/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-storysource",
    "@storybook/addon-controls",
    "@storybook/addon-actions",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
    "@storybook/addon-toolbars",
    "@storybook/addon-viewport",
  ],
  webpackFinal: async (config) => {
    config.module.rules[0].use[0].options.presets = [
      [
        require.resolve("@babel/preset-react"),
        {
          runtime: "automatic",
          importSource: "@emotion/react",
        },
      ],
      require.resolve("@babel/preset-env"),
      require.resolve("@emotion/babel-preset-css-prop"), // <= add this preset
    ];

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          "@emotion/core": toPath("node_modules/@emotion/react"),
          "@emotion/styled": toPath("node_modules/@emotion/styled"),
          "emotion-theming": toPath("node_modules/@emotion/react"),
          "@babel/preset-react": toPath("node_modules/@babel/preset-react"),
        },
      },
    };
  },
};
