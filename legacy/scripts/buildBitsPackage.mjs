import nodePlop from "node-plop";
import { updateBitsPackage } from "./updateBitsPackage.mjs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const plop = await nodePlop(join(__dirname, "..", "plopfile.mjs"));

updateBitsPackage(plop)();
