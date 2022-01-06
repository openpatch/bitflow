import chokidar from "chokidar";
import chalk from "chalk";
import { exec } from "child_process";
import { join } from "path";
import { buildPackage } from "./build.mjs";

const log = console.log.bind(console);

const ignorePackages = [];
const watcher = chokidar.watch(
  ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
  {
    depth: 3,
    persistent: true,
    usePolling: true,
    interval: 500,
  }
);

const localeWatcher = chokidar.watch(["packages/*/src/locales.vocab/*.json"], {
  persistent: true,
  usePolling: true,
  interval: 500,
});

log(chalk.yellow.bold("Watching all files... 👀"));

localeWatcher.on("change", async (filePath) => {
  const splitPath = filePath.split("/");
  const location = `${splitPath[0]}/${splitPath[1]}/`;
  const fileName = splitPath[1];

  if (ignorePackages.includes(fileName)) {
    return;
  }

  log(chalk.yellow(`Changes detected in ${fileName}`));
  exec("yarn vocab compile", { cwd: location }, (err, stdout, stderr) => {
    if (!err || err === null) {
      log(`locales ${chalk.green("success")} - ${splitPath[1]}`);
    } else {
      log(err, stdout, stderr);
    }
  });
});

watcher.on("change", async (filePath) => {
  const splitPath = filePath.split("/");
  const location = `${splitPath[0]}/${splitPath[1]}/`;
  const fileName = splitPath[1];

  if (ignorePackages.includes(fileName)) {
    return;
  }

  log(chalk.yellow(`Changes detected in ${fileName}`));
  await buildPackage(join(process.cwd(), `packages/${fileName}`), fileName);

  exec(`yarn build:types`, { cwd: location }, (err, stdout, stderr) => {
    if (!err || err === null) {
      log(`types ${chalk.green("success")} - ${splitPath[1]}`);
    } else {
      log(err, stdout, stderr);
    }
  });
});
