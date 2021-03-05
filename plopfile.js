module.exports = function (plop) {
  plop.setGenerator("bit", {
    prompts: [
      {
        type: "input",
        name: "packageName",
        message: "bit name please",
      },
    ],
    actions: [
      {
        type: "addMany",
        templateFiles: "plop-templates/bit/**/*",
        destination: "packages/{{ dashCase packageName }}/",
        base: "plop-templates/bit/",
      },
    ],
  });
};
