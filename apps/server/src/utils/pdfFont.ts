import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FALLBACK_FONT_PATH = fileURLToPath(
  new URL("../../src/assets/LiberationSans-Regular.ttf", import.meta.url),
);

const PDF_FONT_CANDIDATES = [
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/Library/Fonts/Arial Unicode.ttf",
  FALLBACK_FONT_PATH,
];

export const PDF_UNICODE_FONT_PATH =
  PDF_FONT_CANDIDATES.find((fontPath) => existsSync(fontPath)) ?? FALLBACK_FONT_PATH;
