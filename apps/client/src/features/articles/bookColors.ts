import type { CSSProperties } from "react";

export type BookColorVars = CSSProperties & {
  "--book-color": string;
  "--book-accent-color": string;
  "--book-label-color": string;
};

function getHexChannel(hex: string, start: number) {
  return Number.parseInt(hex.slice(start, start + 2), 16);
}

export function getReadableTextColor(backgroundColor: string) {
  const hex = backgroundColor.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return "#111827";
  }

  const red = getHexChannel(hex, 1);
  const green = getHexChannel(hex, 3);
  const blue = getHexChannel(hex, 5);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness < 140 ? "#ffffff" : "#111827";
}
