import { chmodSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform === "win32") {
  process.exit(0);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const binDir = path.resolve(here, "..", "node_modules", ".bin");

let entries = [];

try {
  entries = readdirSync(binDir);
} catch {
  process.exit(0);
}

let updated = 0;

for (const entry of entries) {
  if (entry.endsWith(".cmd") || entry.endsWith(".ps1")) {
    continue;
  }

  const fullPath = path.join(binDir, entry);
  const stats = statSync(fullPath, { throwIfNoEntry: false });

  if (!stats?.isFile()) {
    continue;
  }

  const desiredMode = stats.mode | 0o111;

  if (desiredMode === stats.mode) {
    continue;
  }

  chmodSync(fullPath, desiredMode);
  updated += 1;
}

if (updated > 0) {
  console.log(`fixed execute permissions on ${updated} node_modules/.bin shims`);
}
