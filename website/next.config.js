const withMDX = require("@next/mdx")({
  extension: /\.mdx$/,
});

module.exports = withMDX({
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  i18n: {
    locales: ["en-GB", "en-US", "de"],
    defaultLocale: "en-GB",
  },
});
