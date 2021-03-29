module.exports = function (plop) {
  plop.setGenerator("package", {
    prompts: [
      {
        type: "input",
        name: "packageName",
        message: "package name please",
      },
    ],
    actions: [
      {
        type: "addMany",
        templateFiles: "plop-templates/package/**/*",
        destination: "packages/{{ dashCase packageName }}/",
        base: "plop-templates/package/",
      },
    ],
  });
};
