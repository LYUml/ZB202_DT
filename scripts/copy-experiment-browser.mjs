import { copyFile, mkdir } from "node:fs/promises";

const destination = new URL("../dist/src/experiment/", import.meta.url);
await mkdir(destination, { recursive: true });
await copyFile(
  new URL("../web/src/experiment/standalone.js", import.meta.url),
  new URL("standalone.js", destination),
);
console.log("Copied experiment script into dist");
