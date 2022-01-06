import chalk from "chalk";
import { build } from "esbuild";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ignorePackages = [];

export const buildPackage = async (path) => {
  const split = path.split("/");
  const packageName = split[split.length - 1];
  if (ignorePackages.includes(packageName)) {
    return;
  }

  let entry = `${path}/src/index.ts`;

  if (!existsSync(entry)) {
    entry = `${path}/src/index.tsx`;
  }
  const isEntryExists = existsSync(entry);
  let packageJSON;
  try {
    packageJSON = readFileSync(join(`${path}/package.json`), "utf-8");
  } catch (e) {
    return;
  }

  if (!isEntryExists || !packageJSON) {
    throw new Error(`Entry file missing from ${packageName}`);
  }

  const external = [
    ...Object.keys(JSON.parse(packageJSON)?.dependencies || {}),
    ...Object.keys(JSON.parse(packageJSON)?.peerDependencies || {}),
  ];
  external.push("path");
  external.push("fs");

  const commonConfig = {
    entryPoints: [entry],
    outbase: path + "/src",
    outdir: `${path}/dist`,
    jsxFactory: "jsx",
    inject: [join(__dirname, "emotion-shim.js")],
    sourcemap: true,
    minify: false,
    bundle: true,
    external,
  };

  await build({
    ...commonConfig,
    outExtension: {
      ".js": ".cjs.js",
    },
    format: "cjs",
  }).catch((e) => {
    throw new Error(`CJS Build failed for ${packageName} \n ${e}`);
  });

  await build({
    ...commonConfig,
    outExtension: {
      ".js": ".esm.mjs",
    },
    format: "esm",
  }).catch((e) => {
    throw new Error(`ESM Build failed for ${packageName} \n ${e}`);
  });

  console.log(`build ${chalk.green("success")} - ${packageName}`);
};
