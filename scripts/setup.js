import { copyFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root   = dirname(dirname(fileURLToPath(import.meta.url)));
const nm     = (...p) => join(root, "node_modules", ...p);
const pub    = (...p) => join(root, "public", ...p);

await mkdir(pub("scram"),   { recursive: true });
await mkdir(pub("epoxy"),   { recursive: true });
await mkdir(pub("baremux"), { recursive: true });

const copies = [
  [nm("@mercuryworkshop", "scramjet",        "dist", "scramjet.bundle.js"), pub("scram",   "scramjet.bundle.js")],
  [nm("@mercuryworkshop", "scramjet",        "dist", "scramjet.sync.js"),   pub("scram",   "scramjet.sync.js")],
  [nm("@mercuryworkshop", "scramjet",        "dist", "scramjet.wasm.wasm"), pub("scram",   "scramjet.wasm.wasm")],
  [nm("@mercuryworkshop", "epoxy-transport", "dist", "index.mjs"),          pub("epoxy",   "index.mjs")],
  [nm("@mercuryworkshop", "bare-mux",        "dist", "worker.js"),          pub("baremux", "worker.js")],
  [nm("@mercuryworkshop", "bare-mux",        "dist", "index.mjs"),          pub("baremux", "index.mjs")],
];

for (const [src, dest] of copies) {
  try {
    await copyFile(src, dest);
    console.log("  copied", dest.split("public")[1]);
  } catch (e) {
    console.warn("  missing:", src);
  }
}

console.log("build complete.");
