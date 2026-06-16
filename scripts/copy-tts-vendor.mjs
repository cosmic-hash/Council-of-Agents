import { cpSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const piperSrc = path.join(root, "node_modules/@mintplex-labs/piper-tts-web/dist");
const onnxSrc = path.join(root, "node_modules/onnxruntime-web/dist");
const piperDest = path.join(root, "public/vendor/piper");
const onnxDest = path.join(root, "public/vendor/onnx");

if (!existsSync(piperSrc)) {
  console.warn("copy-tts-vendor: piper package not installed, skipping");
  process.exit(0);
}

mkdirSync(piperDest, { recursive: true });
mkdirSync(onnxDest, { recursive: true });

cpSync(piperSrc, piperDest, { recursive: true });
cpSync(path.join(onnxSrc, "ort.bundle.min.mjs"), path.join(onnxDest, "ort.bundle.min.mjs"));

console.log("copy-tts-vendor: copied Piper + ONNX bundles to public/vendor/");
