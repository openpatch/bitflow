import { NodePlopAPI } from "plop";

export default function (plop: NodePlopAPI) {
  plop.setGenerator("bit", {
    description: "Creates a new Bit package.",
    prompts: [
      {
        type: "list",
        name: "type",
        choices: ["end", "start", "task", "title", "input"],
      },
      {
        type: "input",
        name: "name",
        message: "name please",
      },
    ],
    actions: [
      {
        type: "addMany",
        templateFiles: "plop-templates/bits/{{ type }}/**/*",
        destination: "packages/{{ type }}-{{ dashCase name }}/",
        base: "plop-templates/bits/{{ type }}",
      },
    ],
  });
  plop.setGenerator("plain package", {
    description: "Creates a plain TypeScript package.",
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
}
