const withMDX = require("@next/mdx")({
  extension: /\.mdx$/,
});

module.exports = withMDX({
  future: {
    webpack5: false,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  i18n: {
    locales: ["en-GB", "en-US", "de"],
    defaultLocale: "en-GB",
  },
});
