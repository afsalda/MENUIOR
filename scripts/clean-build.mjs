import path from "node:path";
import { rm } from "node:fs/promises";
const output = path.resolve("dist");
if (path.dirname(output) !== path.resolve(process.cwd()))
  throw new Error("Build output must be inside this project");
await rm(output, { recursive: true, force: true });
