import { closeSync, mkdirSync, openSync, readSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { IfcImporter } from "@thatopen/fragments";

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error("Usage: npm run bim:convert -- <model.ifc> [output.frag]");
  process.exit(1);
}

const inputPath = resolve(inputArg);
const defaultName = `${basename(inputPath, extname(inputPath))}.frag`;
const outputPath = resolve(outputArg || `web/public/models/fragments/${defaultName}`);
const wasmPath = fileURLToPath(new URL("../node_modules/web-ifc/", import.meta.url));
const chunkSize = 1024 * 1024;
const chunk = new Uint8Array(chunkSize);
const fileDescriptor = openSync(inputPath, "r");

try {
  const importer = new IfcImporter();
  importer.wasm.path = wasmPath;
  importer.wasm.absolute = true;
  importer.includeUniqueAttributes = true;
  importer.includeRelationNames = true;
  importer.webIfcSettings.COORDINATE_TO_ORIGIN = true;

  console.log(`Converting ${inputPath}`);
  const fragments = await importer.process({
    readFromCallback: true,
    readCallback(offset) {
      const bytesRead = readSync(fileDescriptor, chunk, 0, chunkSize, offset);
      return chunk.slice(0, bytesRead);
    },
    raw: false,
    progressCallback(progress) {
      const percent = Math.round(progress * 100);
      process.stdout.write(`\rIFC -> Fragments ${percent}%`);
    },
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, fragments);
  console.log(`\nCreated ${outputPath} (${(fragments.byteLength / 1024 / 1024).toFixed(2)} MB)`);
} finally {
  closeSync(fileDescriptor);
}
