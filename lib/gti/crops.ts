import "server-only";

import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { NormalizedCropRegion } from "@/lib/gti/template-fields";

export type CroppedImage = {
  label: string;
  mimeType: "image/png";
  bytes: Buffer;
};

export async function cropImageRegion({
  sourceBytes,
  region,
  label,
  margin = 0.015,
}: {
  sourceBytes: Buffer;
  region: NormalizedCropRegion;
  label: string;
  margin?: number;
}): Promise<CroppedImage> {
  const image = await loadImage(sourceBytes);
  const sourceWidth = Math.max(image.width, 1);
  const sourceHeight = Math.max(image.height, 1);
  const expanded = expandRegion(region, margin);
  const left = clamp(Math.round(expanded.left * sourceWidth), 0, sourceWidth - 1);
  const top = clamp(Math.round(expanded.top * sourceHeight), 0, sourceHeight - 1);
  const width = clamp(
    Math.round(expanded.width * sourceWidth),
    64,
    sourceWidth - left,
  );
  const height = clamp(
    Math.round(expanded.height * sourceHeight),
    64,
    sourceHeight - top,
  );
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.drawImage(image, left, top, width, height, 0, 0, width, height);

  return {
    label,
    mimeType: "image/png",
    bytes: canvas.toBuffer("image/png"),
  };
}

export function expandRegion(region: NormalizedCropRegion, margin: number) {
  const left = clampNumber(region.left - margin, 0, 1);
  const top = clampNumber(region.top - margin, 0, 1);
  const right = clampNumber(region.left + region.width + margin, 0, 1);
  const bottom = clampNumber(region.top + region.height + margin, 0, 1);

  return {
    left,
    top,
    width: Math.max(0.01, right - left),
    height: Math.max(0.01, bottom - top),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
