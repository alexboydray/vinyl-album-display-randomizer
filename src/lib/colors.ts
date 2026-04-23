"use client";

import { Vibrant } from "node-vibrant/browser";
import type { ColorBucket } from "@/types";

export async function extractColorBucket(
  imageUrl: string
): Promise<ColorBucket> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    const swatch =
      palette.Vibrant ??
      palette.DarkVibrant ??
      palette.LightVibrant ??
      palette.Muted ??
      palette.DarkMuted ??
      palette.LightMuted;
    if (!swatch) return "grayscale";
    const [r, g, b] = swatch.rgb;
    return bucketFromRgb(r, g, b);
  } catch {
    return "grayscale";
  }
}

function bucketFromRgb(r: number, g: number, b: number): ColorBucket {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < 0.18 || l < 0.08 || l > 0.94) return "grayscale";
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "yellow";
  if (h < 165) return "green";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R:
        h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
        break;
      case G:
        h = ((B - R) / d + 2) * 60;
        break;
      case B:
        h = ((R - G) / d + 4) * 60;
        break;
    }
  }
  return [h, s, l];
}
