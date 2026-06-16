import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse a #rrggbb hex string into an [r, g, b] tuple (0-255). */
export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Copy raw RGBA pixels into a fresh ImageData for putImageData. */
export function toImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ImageData {
  const img = new ImageData(width, height);
  img.data.set(data);
  return img;
}
