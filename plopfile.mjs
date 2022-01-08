import {updateBitsPackage} from "./scripts/updateBitsPackage.mjs";
import { execSync } from "child_process";

export default function (plop) {
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
      () => {
        updateBitsPackage(plop)()
    execSync("pnpm i");
      }
    ],
  });
  plop.setGenerator("component package", {
    description: "Creates a component TypeScript package.",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "component name please",
      },
    ],
    actions: [
      {
        type: "addMany",
        templateFiles: "plop-templates/component/**/*",
        destination: "packages/{{ dashCase name }}/",
        base: "plop-templates/component/",
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
