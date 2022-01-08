import fs from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export function updateBitsPackage(plop) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const properCase = plop.getHelper("properCase");
  plop.setHelper("single", (l) => l.length === 1);

  function bitData(dir) {
    const [type, key] = dir.split("-", 2);
    return {
      key,
      name: `${properCase(type)}${properCase(key)}`,
      type,
      package: `@bitflow/${dir}`,
    };
  }
  return function () {
    const templatePath = join(
      __dirname,
      "..",
      "plop-templates/bits/index.ts.hbs"
    );
    const templateFile = fs.readFileSync(templatePath, "utf8");
    const path = join(__dirname, "..", "packages", "bits", "src", "index.ts");

    const packagesPath = join(__dirname, "..", "packages");
    const bitsDirs = fs.readdirSync(packagesPath);
    const startBits = bitsDirs
      .filter((b) => b.startsWith("start-"))
      .map(bitData);
    const endBits = bitsDirs.filter((b) => b.startsWith("end-")).map(bitData);
    const taskBits = bitsDirs.filter((b) => b.startsWith("task-")).map(bitData);
    const inputBits = bitsDirs
      .filter((b) => b.startsWith("input-"))
      .map(bitData);
    const titleBits = bitsDirs
      .filter((b) => b.startsWith("title-"))
      .map(bitData);
    const bits = [
      ...startBits,
      ...endBits,
      ...taskBits,
      ...inputBits,
      ...titleBits,
    ];

    const renderedTemplate = plop.renderString(templateFile, {
      startBits,
      endBits,
      taskBits,
      inputBits,
      titleBits,
      bits,
    });

    fs.writeFileSync(path, renderedTemplate);

    const pkgPath = join(packagesPath, "bits", "package.json");
    const pkgFile = fs.readFileSync(pkgPath);
    const pkgJson = JSON.parse(pkgFile);

    pkgJson.dependencies = {};
    bits.forEach((b) => {
      pkgJson.dependencies[b.package] = "workspace:*";
    });

    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2));

    execSync("pnpm i");

    return "updated @bitflow/bits package";
  };
}
