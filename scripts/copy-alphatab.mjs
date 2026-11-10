/*
 * Copies the tab player's runtime files (the alphaTab script, its music font
 * and its sound bank) from node_modules into public/alphatab, where the tab
 * page loads them on demand. Runs after every install, so the files never
 * need to be committed.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@coderline", "alphatab", "dist");
const target = join(root, "public", "alphatab");

if (!existsSync(source)) {
  console.warn(
    "copy-alphatab: @coderline/alphatab is not installed; the tab player will not load.",
  );
  process.exit(0);
}

const files = [
  ["alphaTab.min.js", "alphaTab.min.js"],
  ["font/Bravura.woff2", "font/Bravura.woff2"],
  ["font/Bravura.woff", "font/Bravura.woff"],
  ["font/Bravura-OFL.txt", "font/Bravura-OFL.txt"],
  ["soundfont/sonivox.sf2", "soundfont/sonivox.sf2"],
  ["soundfont/LICENSE", "soundfont/LICENSE"],
];

for (const [from, to] of files) {
  const destination = join(target, to);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(source, from), destination);
}
console.log(`copy-alphatab: ${files.length} files copied to public/alphatab`);
