module.exports = {
  presets: [
    "@babel/preset-env",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
        importSource: "@emotion/react",
      },
    ],
    "@babel/preset-typescript",
    "@emotion/babel-preset-css-prop",
  ],
  plugins: ["@babel/plugin-transform-runtime"],
};
