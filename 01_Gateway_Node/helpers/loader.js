import path from "path";
import { fileURLToPath } from "url";
import { safeRead } from "./fs.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const config = JSON.parse(safeRead(path.resolve(__dirname, '../../Config/option-config.json')));